import express from 'express'
import { Types as MongooseTypes } from 'mongoose'

import { api } from 'src/util/api'
import { roleCheck } from 'src/modules/admin/middleware'
import { APIValidationError } from 'src/util/errors'
import { type RouterApp } from 'src/util/api'
import { type User } from 'src/modules/user/types'
import { type Raffle } from '../documents/raffle'
import { creditBalance } from 'src/modules/user/balance'
import { getUserById } from 'src/modules/user'
import { isRoleAccessPermitted } from 'src/modules/rbac'

import { parseRaffleBody, populateRaffleForUser, drawWinners } from '../lib/ops'
import { getTickets } from '../documents/raffleTicket'
import { getRaffleSchema } from '../lib/types'
import { getRaffles, getRaffle, upsertRaffle } from '../documents/raffle'
import { bustAllRaffleCacheData, cacheRaffleData } from '../lib/cache'
import { MutexLock } from 'src/util/named-lock'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/raffle', router)

  router.get(
    '/',
    api.validatedApiCall(async req => {
      // Optionally pull userId from request session, if available.
      const user = req.user ? (req.user as User) : undefined

      const raffles: Raffle[] = await cacheRaffleData('list', 60, getRaffles)

      return {
        raffles: await Promise.all(
          raffles.map(
            async raffle => await populateRaffleForUser(raffle, user),
          ),
        ),
      }
    }),
  )

  router.post(
    '/',
    ...roleCheck([{ resource: 'raffles', action: 'create' }]),
    api.validatedApiCall(async req => {
      const incoming = parseRaffleBody(req)

      if (!incoming.type) {
        throw new APIValidationError('api__missing_param', ['type'])
      }

      if (!incoming.name) {
        throw new APIValidationError('api__missing_param', ['name'])
      }

      // TODO: Validate start/end dates.
      if (!incoming.start) {
        throw new APIValidationError('api__missing_param', ['start'])
      }

      if (!incoming.end) {
        throw new APIValidationError('api__missing_param', ['end'])
      }

      if (!incoming.slug) {
        throw new APIValidationError('api__missing_param', ['slug'])
      }

      if (!incoming.amount || incoming.amount < 1) {
        throw new APIValidationError('api__missing_param', ['amount'])
      }

      if (!incoming.winnerCount || incoming.winnerCount < 1) {
        throw new APIValidationError('api__missing_param', ['winnerCount'])
      }

      if (!incoming.ticketsPerDollar || incoming.ticketsPerDollar <= 0) {
        throw new APIValidationError('api__missing_param', ['ticketsPerDollar'])
      }

      if (!incoming.baseDollarAmount || incoming.baseDollarAmount <= 0) {
        throw new APIValidationError('api__missing_param', ['ticketsPerDollar'])
      }

      // TODO: Validate images
      if (!incoming.bannerImage) {
        throw new APIValidationError('api__missing_param', ['bannerImage'])
      }

      if (!incoming.featureImage) {
        throw new APIValidationError('api__missing_param', ['featureImage'])
      }

      if (!incoming.heroImage) {
        throw new APIValidationError('api__missing_param', ['heroImage'])
      }

      if (!incoming.payouts) {
        throw new APIValidationError('api__missing_param', ['payouts'])
      }

      const raffle = await upsertRaffle(incoming)

      await bustAllRaffleCacheData()

      return { raffle }
    }),
  )

  router.patch(
    '/:id',
    ...roleCheck([{ resource: 'raffles', action: 'update' }]),
    api.validatedApiCall(async req => {
      const { id } = req.params

      if (typeof id !== 'string') {
        throw new APIValidationError('api__missing_param', ['raffle id'])
      }

      const incoming = parseRaffleBody(req)

      if (incoming.winnersRevealed) {
        const original = await getRaffle(id)

        if (!original) {
          throw new APIValidationError(
            'Specified raffle is nonexistent or inactive.',
          )
        }

        if (!original.winners || original.winners.length <= 0) {
          throw new APIValidationError(
            'Winners have not been chosen for this raffle.',
          )
        }
      }

      const raffle = await upsertRaffle({ ...incoming, _id: id })

      await bustAllRaffleCacheData()

      return { raffle }
    }),
  )

  router.get(
    '/:idOrSlug',
    api.validatedApiCall(async req => {
      const { idOrSlug: id } = req.params
      const user = req.user ? (req.user as User) : undefined

      const hasRaffleReadAccess = await isRoleAccessPermitted({
        user,
        requests: [{ action: 'read', resource: 'raffles' }],
      })

      if (typeof id !== 'string') {
        throw new APIValidationError('api__missing_param', ['raffle id/slug'])
      }

      const raffle = await getRaffle(id)

      if (!raffle) {
        return { raffle: null }
      }

      if (!hasRaffleReadAccess) {
        // Do not allow users to see raffles that have not started
        if (new Date(raffle.start) > new Date()) {
          return { raffle: null }
        }
      }

      return {
        raffle: await populateRaffleForUser(raffle, user, true),
      }
    }),
  )

  router.get(
    '/:id/tickets',
    api.check,
    api.validatedApiCall(async req => {
      const { id } = req.params
      const userId = (req.user as User).id

      if (typeof id !== 'string') {
        throw new APIValidationError('api__missing_param', ['raffle id'])
      }

      const raffleId = new MongooseTypes.ObjectId(id)
      const tickets = await getTickets(raffleId, userId)

      return { tickets }
    }),
  )

  router.post(
    '/:id/claim',
    api.check,
    api.validatedApiCall(async req => {
      const { id } = req.params
      const { dry, coinSide } = req.body
      const userId = (req.user as User).id

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('user__invalid_id')
      }

      if (typeof id !== 'string') {
        throw new APIValidationError('api__missing_param', ['raffle id'])
      }

      const raffle = await getRaffle(id)

      if (!raffle) {
        return { raffle: null }
      }

      const type = getRaffleSchema(raffle.type)

      if (!type.rakeback) {
        throw new APIValidationError(
          'Invalid raffle type. This raffle does not support rakeback.',
        )
      }

      const dryRun = dry === true

      // Create lock to prevent concurrent claims.
      const lock = await MutexLock.acquireLock(
        raffle._id.toString(),
        'raffle',
        'claim',
        1000 * 60,
      )

      if (!lock) {
        throw new APIValidationError('slow_down')
      }

      try {
        const result = await type.calcRakeback(raffle, userId, dryRun, coinSide)

        if (!result.success) {
          throw new APIValidationError(result.reason)
        }

        // On dry run, do not credit user.
        if (dry !== true) {
          // Award user rakeback.
          await creditBalance({
            user,
            amount: result.amount,
            meta: {
              raffleId: raffle.id,
            },
            transactionType: 'raffle',
            balanceTypeOverride: null,
          })
        }

        return { rakebackAmount: result.amount }
      } finally {
        await lock.release()
      }
    }),
  )

  router.post(
    '/:id/drawWinners',
    api.check,
    ...roleCheck([{ resource: 'raffles', action: 'update' }]),
    api.validatedApiCall(async req => {
      const { id } = req.params
      const user = req.user ? (req.user as User) : undefined

      if (typeof id !== 'string') {
        throw new APIValidationError('api__missing_param', ['raffleId'])
      }

      try {
        const raffle = await drawWinners({ raffleId: id })

        await bustAllRaffleCacheData()

        return {
          raffle: await populateRaffleForUser(raffle, user, true),
        }
      } catch (error) {
        if (error instanceof Error) {
          throw new APIValidationError(error.message)
        }

        throw error
      }
    }),
  )
}
