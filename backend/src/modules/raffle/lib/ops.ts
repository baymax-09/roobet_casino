import { type Request } from 'express'
// TODO use time helpers instead of date-fns
import { isBefore } from 'date-fns'

import {
  getUserForDisplay,
  getUserById,
  userIsLocked,
  shouldHideUser,
} from 'src/modules/user'
import { isRoleAccessPermitted } from 'src/modules/rbac'
import { type User } from 'src/modules/user/types'
import { type BetHistory } from 'src/modules/bet/types'
import { getGame } from 'src/modules/tp-games/documents/games'

import { getRaffleSchema } from './types'
import * as RaffleTicket from '../documents/raffleTicket'
import * as Raffle from '../documents/raffle'
import { type Raffle as RaffleType } from '../documents/raffle'
import { cacheRaffleData } from './cache'
import { raffleLogger } from './logger'

export const REDIS_CACHE_NAME = 'rafflesv2'

/**
 * Utility used in conjunction with Raffle write
 * operations. Sanitizes user input.
 */
export const parseRaffleBody = (req: Request) => {
  const doc = req.body as Partial<Raffle.Raffle>

  return {
    amount: doc?.amount,
    archived: doc?.archived,
    bannerImage: doc?.bannerImage,
    end: doc?.end,
    featureImage: doc?.featureImage,
    heroImage: doc?.heroImage,
    modifiers: doc?.modifiers,
    name: doc?.name,
    payouts: doc?.payouts,
    slug: doc?.slug,
    start: doc?.start,
    ticketsPerDollar: doc?.ticketsPerDollar,
    baseDollarAmount: doc?.baseDollarAmount,
    type: doc?.type,
    winnerCount: doc?.winnerCount,
    winnersRevealed: doc?.winnersRevealed,
  }
}

const getCachedActiveRaffles = async () => {
  const raffles: Raffle.Raffle[] = await cacheRaffleData(
    'activeList',
    60,
    Raffle.getActiveRaffles,
  )

  return raffles
}

const addToRaffle = async (raffle: Raffle.Raffle, bet: BetHistory) => {
  const tickets = await getRaffleTicketsForBet(raffle, bet)
  await RaffleTicket.addTickets(raffle._id, bet.userId, tickets)
}

export const addToActiveRaffles = async (bet: BetHistory) => {
  try {
    const raffles = await getCachedActiveRaffles()

    await Promise.all(
      raffles.map(async raffle => {
        const schema = getRaffleSchema(raffle.type)

        if (schema.awardTickets === false) {
          return null
        }

        await addToRaffle(raffle, bet)
      }),
    )
  } catch (error) {
    raffleLogger('addToActiveRaffles', { userId: bet.userId }).error(
      `Failed to award raffle tickets - ${error.message}`,
      { bet },
      error,
    )
  }
}

export const populateRaffleForUser = async (
  raffle: Raffle.Raffle,
  user: User | undefined,
  includeWinners = false,
) => {
  const { id: userId } = user ?? {}

  const schema = getRaffleSchema(raffle.type)

  const tickets = userId
    ? await RaffleTicket.getTickets(raffle._id, userId)
    : null
  const hasRaffleReadAccess = await isRoleAccessPermitted({
    user,
    requests: [{ action: 'read', resource: 'raffles' }],
  })

  const winners = await (async () => {
    // raffles moved over to GQL, use field config.
    if (!(raffle.winnersRevealed || hasRaffleReadAccess)) {
      return []
    }

    if (!includeWinners) {
      return raffle.winners
    }

    return await Promise.all(
      (raffle.winners ?? []).map(async userId => {
        const userDoc = await getUserById(userId)
        const tickets = (await RaffleTicket.getTickets(raffle._id, userId)) ?? {
          tickets: 0,
        }

        if (userDoc) {
          const hidden = await shouldHideUser(userDoc)
          if (!hidden || hasRaffleReadAccess) {
            return {
              tickets: {
                tickets: tickets.tickets,
              },
              user: await getUserForDisplay(userDoc),
            }
          }
        }

        return {
          tickets,
          user: { id: userId, hidden: true, name: 'Hidden' },
        }
      }),
    )
  })()

  const hasClaimedRakeback =
    userId && schema?.rakeback
      ? await schema.hasClaimedRakeback(raffle, userId)
      : undefined

  return {
    ...raffle,
    winners,
    tickets,
    hasClaimedRakeback,
  }
}

/**
 * Select indices from array with weighted random sampling
 * @param weights Array of weights to sample from
 * @param count Number of indices to select
 * @returns Array of selected indices
 */
const weightedRandomIndices = (weights: number[], count: number): number[] => {
  const indices: number[] = []

  while (indices.length < count) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    let randomNumber = Math.random() * totalWeight

    for (let i = 0; i < weights.length; i++) {
      const weight = weights[i]

      if (randomNumber < weight) {
        indices.push(i)
        weights[i] = 0 // Set the weight to 0 to prevent the same index from being selected again
        break
      }

      randomNumber -= weight
    }
  }

  return indices
}

/**
 * Select winners for a raffle by id using weighted random sampling
 * @param param0 { redraw, raffleId, existingWinners, ineligible }
 * @returns updated instance of Raffle
 */
export async function drawWinners({
  raffleId,
  existingWinners = [],
  ineligible = [],
}: {
  raffleId: string
  existingWinners?: string[]
  ineligible?: string[]
}): Promise<Raffle.Raffle> {
  const logger = raffleLogger('drawWinners', { userId: null })
  const raffle = await Raffle.getRaffle(raffleId)

  if (!raffle) {
    throw new Error('Specified raffle is nonexistent or inactive.')
  }

  if (raffle.winnersRevealed) {
    throw new Error('Winners have already been revealed for this raffle.')
  }

  // Commenting this out for some raffle madness we're doing.
  if (isBefore(new Date(), new Date(raffle.end))) {
    throw new Error('Raffle period has not ended yet.')
  }

  const uniqueTicketCount = await RaffleTicket.getUniqueTicketsForRaffleById(
    raffle._id,
    ineligible,
  )

  if (uniqueTicketCount < raffle.winnerCount) {
    throw new Error('There are not enough tickets to draw winners.')
  }

  const winnersSet = new Set(existingWinners)
  const ineligibleSet = new Set(ineligible)

  const totalTicketCount = await RaffleTicket.getTicketCount(raffle._id, {
    userId: { $nin: [...winnersSet, ...ineligibleSet] },
  })

  if (totalTicketCount <= winnersSet.size) {
    throw new Error('All tickets have already been won in this raffle.')
  }

  if (totalTicketCount - winnersSet.size < raffle.winnerCount) {
    throw new Error('There are not enough tickets left to draw winners.')
  }

  const userIds: string[] = []
  const ticketCounts: number[] = []

  const cursor = RaffleTicket.RaffleTicketModel.find(
    {
      raffleId: raffle._id,
      userId: { $nin: [...winnersSet, ...ineligibleSet] },
      tickets: { $gte: 1 },
    },
    { userId: true, tickets: true },
  ).cursor()

  // Aggregate user and ticket information before drawing winners.
  for await (const doc of cursor) {
    const { userId, tickets } = doc

    userIds.push(userId)
    ticketCounts.push(tickets)
  }

  cursor.close()

  // Pick winners until we have reached the expected number.
  while (winnersSet.size < raffle.winnerCount) {
    const winnersToDraw = raffle.winnerCount - winnersSet.size

    logger.info(`Attempting to draw ${winnersToDraw} winners.`, {
      winnersToDraw,
      raffleId,
      winnersSet,
    })

    const indices = weightedRandomIndices(ticketCounts, winnersToDraw)

    for (const index of indices) {
      const userId = userIds[index]

      if (winnersSet.has(userId)) {
        logger.info(`User ${userId} has already been selected, skipping.`, {
          winnersToDraw,
          raffleId,
          winnersSet,
          drawnUser: userId,
        })
        continue
      }

      if (ineligibleSet.has(userId)) {
        logger.info(`User ${userId} is ineligible, skipping.`, {
          winnersToDraw,
          raffleId,
          winnersSet,
          drawnUser: userId,
        })
      }

      const user = await getUserById(userId)

      // Check if user is locked.
      if (!user || (await userIsLocked(user))) {
        logger.info(`User ${userId} is locked, skipping.`, {
          winnersToDraw,
          raffleId,
          winnersSet,
          drawnUser: userId,
        })
        continue
      }

      winnersSet.add(userId)
    }
  }

  const upsertResult = await Raffle.upsertRaffle({
    _id: raffle._id,
    $set: { winners: [...winnersSet] },
  })

  return upsertResult ?? raffle
}

/**
 * Get the number of raffle tickets for a given raffle and bet.
 * @param raffle | instance of RaffleType
 * @param bet | instance of Bet
 * @returns number of tickets to issue for the bet
 */
export const getRaffleTicketsForBet = async (
  raffle: RaffleType,
  bet: BetHistory,
) => {
  let ticketsPerDollar = raffle.ticketsPerDollar

  // check the bet against all modifiers
  if (raffle.modifiers && raffle.modifiers.length > 0 && bet.gameIdentifier) {
    for (const modifier of raffle.modifiers) {
      // Handle gameIdentifier modifier
      if (
        modifier.type === 'gameIdentifier' &&
        modifier.identifiers.find(
          identifier => identifier.id === bet.gameIdentifier,
        )
      ) {
        ticketsPerDollar = Math.max(ticketsPerDollar, modifier.ticketsPerDollar)
        continue
      }

      // Handle gameGroup modifier
      if (modifier.type === 'gameGroup') {
        const game = await getGame({ identifier: bet.gameIdentifier })

        if (game?.tags) {
          for (const tag of game.tags) {
            if (
              modifier.identifiers.find(identifier => identifier.id === tag)
            ) {
              ticketsPerDollar = Math.max(
                ticketsPerDollar,
                modifier.ticketsPerDollar,
              )
              break
            }
          }
        }
      }

      // Handle gameProvider modifier
      if (modifier.type === 'gameProvider') {
        const game = await getGame({ identifier: bet.gameIdentifier })
        for (const identifier of modifier.identifiers) {
          if (game?.providerInternal === identifier.id) {
            ticketsPerDollar = Math.max(
              ticketsPerDollar,
              modifier.ticketsPerDollar,
            )
            break
          }
        }
      }
    }
  }

  return ticketsPerDollar * bet.betAmount
}
