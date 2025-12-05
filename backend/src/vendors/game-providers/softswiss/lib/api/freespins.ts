import { config } from 'src/system'
import { APIValidationError } from 'src/util/errors'
import { getUserById } from 'src/modules/user'
import { createTransaction } from 'src/modules/user/documents/transaction'
import { addTimeInDuration } from 'src/util/helpers/time'
import { type ErrorFreeSpins } from 'src/modules/inventory/documents/types'
import { type FreespinIssuer } from 'src/modules/tp-games'
import { createFreeSpinUserNotification } from '../../../util'

import { getUserRequestObject } from '../util'
import { updateFreespins, deleteFreespins } from '../../documents/freespins'
import { softswissLogger } from '../logger'
import { post, getHeaders } from './play'

const CASINO_ID = config.softswiss.casinoId

export async function issueFreespins(
  userId: string,
  // this is a concatenated list of comma separated games
  games: string,
  freespins_quantity: number,
  bet_level: number,
  valid_until: string = addTimeInDuration(30, 'days', new Date()).toISOString(),
  issuerId: FreespinIssuer,
  reason: string,
  errorsFreeSpins?: ErrorFreeSpins,
  sendNotification = true,
) {
  const logger = softswissLogger('issueFreespins', { userId })
  const endpoint = 'freespins/issue'

  const user = await getUserById(userId)

  if (!user) {
    throw new APIValidationError('user__does_not_exist')
  }

  // create freespins issue in table!
  const issue = await updateFreespins(
    {
      games: games.split(','),
      freespins_quantity,
      bet_level,
      valid_until,
      userId,
      issuer_id: issuerId,
      reason,
    },
    {},
  )

  const body = {
    casino_id: CASINO_ID,
    currency: 'USD',
    user: await getUserRequestObject(user, undefined, 'usd'),
    games: games.split(','),
    freespins_quantity,
    bet_level,
    valid_until,
    issue_id: issue._id.toString(),
  }

  try {
    logger.info('X-REQUEST-SIGN', { headers: getHeaders(body) })
    await post(endpoint, body, getHeaders(body))
    await createTransaction({
      user,
      amount: 0,
      transactionType: 'bonus',
      meta: {
        freespins_quantity,
        bet_level,
        games: games.split(','),
        provider: 'softswiss',
      },
      balanceType: 'crypto',
      resultantBalance: user.balance,
    })
    // Keeps track of the issueIds that may need to be rolled back
    if (errorsFreeSpins) {
      errorsFreeSpins.softswissIssueIds.push(issue._id.toString())
    }

    if (sendNotification) {
      await Promise.all(
        games.split(',').map(async gameIdentifier => {
          await createFreeSpinUserNotification({
            userId,
            gameIdentifier,
          })
        }),
      )
    }
  } catch (error) {
    if (error.error?.code !== 500) {
      await deleteFreespins(issue._id)
    }
    logger.error('issueFreespins error', error?.error)
    throw new APIValidationError(error.error.message)
  }
}

export async function cancelFreespins(issue_id: string) {
  const logger = softswissLogger('cancelFreespins', { userId: null })
  const endpoint = 'freespins/cancel'
  const body = {
    casino_id: CASINO_ID,
    issue_id,
  }

  try {
    logger.info('X-REQUEST-SIGN', { headers: getHeaders(body) })
    await post(endpoint, body, getHeaders(body))
  } catch (error) {
    logger.error('error', {}, error)
  } finally {
    await deleteFreespins(issue_id)
  }
}
