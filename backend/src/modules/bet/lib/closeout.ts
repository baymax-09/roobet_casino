import { getUserById } from 'src/modules/user'
import { Cooldown } from 'src/util/redisModels'
import { getGameEdge } from 'src/modules/game'

import { afterBetHooks } from './hooks'
import { updateBetHistoryById as updateBetHistoryMongoById } from '../documents/bet_history_mongo'
import { deleteActiveBetById } from '../documents/active_bet'
import { payoutBet } from '../lib/payout'
import { betLogger } from '../lib/logger'
import { type BetHistoryDocument } from '../documents/bet_history_mongo'

const parseError = (error: unknown): string => {
  if (!error) {
    return ''
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && Object.hasOwn(error, 'toString')) {
    return error.toString()
  }

  return JSON.stringify(error)
}

export async function closeOutBet(
  bet: BetHistoryDocument,
  balanceUpdateTimestamp: Date = new Date(),
): Promise<{ success: boolean }> {
  const logger = betLogger('closeOutBet', { userId: bet.userId })
  // The betId is always the activeBetId for house games.
  const { betId: activeBetId } = bet

  const cooldownHistory = await Cooldown.checkSet(
    `closeOutBet:${activeBetId}`,
    10,
  )

  if (cooldownHistory > 0) {
    logger.info(
      `Bet with betId ${activeBetId} has been closed out too recently`,
      { bet },
    )
    return { success: true }
  }

  if (!bet.closedOut || bet.closeoutComplete) {
    return { success: true }
  }

  if ((bet.attempts ?? 0) > 10) {
    logger.error(
      `Bet ${bet._id} has failed 10 attempts and we are stopping payout.`,
      { bet },
      bet.errors,
    )

    return { success: false }
  }

  const user = await getUserById(bet.userId)

  if (!user) {
    await deleteActiveBetById(activeBetId)
    await updateBetHistoryMongoById(bet._id, {
      errors: { user: 'user no longer active' },
      closeoutComplete: true,
      $inc: { attempts: 1 },
    })

    return { success: true }
  }

  // Keep track of errors, which is also the opposite of the completion status.
  const errors: Record<'paidOut' | 'ranHooks', string | undefined> = {
    paidOut: undefined,
    ranHooks: undefined,
  }

  if (!bet.paidOut) {
    try {
      await payoutBet(user, bet, balanceUpdateTimestamp)
    } catch (error) {
      errors.paidOut = parseError(error)
    }
  }

  // Need to run afterBetHooks after the active bet is removed to correctly update bet goal.
  if (!bet.ranHooks) {
    try {
      const edge = getGameEdge(bet.gameName)
      await afterBetHooks({ user, betHistory: bet, edge })
    } catch (error) {
      errors.ranHooks = parseError(error)
    }
  }

  await updateBetHistoryMongoById(bet._id, {
    errors,
    paidOut: !errors.paidOut,
    ranHooks: !errors.ranHooks,
    closeoutComplete: true,
    $inc: { attempts: 1 },
  })

  // Delete active bet record if we completed closeout.
  if (bet.deleteAfterRecord) {
    await deleteActiveBetById(activeBetId)
  }

  return { success: true }
}
