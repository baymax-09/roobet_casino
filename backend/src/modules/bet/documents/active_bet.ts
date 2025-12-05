import { type ChangeEvent } from 'rethinkdbdash'

import { winston, config, r } from 'src/system'
import { APIValidationError } from 'src/util/errors'
import { recursiveChangefeedHandler } from 'src/util/rethink'
import { emitSocketEventForGame } from 'src/modules/game'

import { closeOutBet } from '../lib/closeout'
import { type DBCollectionSchema } from 'src/modules'
import { type ActiveBet as ActiveBetType } from '../types'
import { recordAndReturnBetHistory } from './bet_history_mongo'
import { type BetHistory } from './bet_history_mongo'

/**
 * Do not use my exported value outside of this file. Please do not follow this pattern.
 */
export const ActiveBet = r.table<ActiveBetType>('active_bet')

export async function deleteAllActiveBetsForGameId(gameId: string) {
  return await ActiveBet.getAll(gameId, { index: 'gameId' }).delete().run()
}

export async function deleteActiveBetById(id: string) {
  return await ActiveBet.get(id).delete().run()
}

export async function getActiveBetsForGame(gameId: string) {
  return await ActiveBet.getAll(gameId, { index: 'gameId' }).run()
}

export async function getActiveBetsForUser(
  userId: string,
  timeout: number = 60 * 5,
) {
  return await ActiveBet.between(
    [userId, r.now().sub(timeout)],
    [userId, r.maxval],
    { index: 'userId__timestamp' },
  ).run()
}

export async function getActiveBetsForUserNotClosedOut(userId: string) {
  return await ActiveBet.getAll(userId, { index: 'userId' })
    .filter({ closedOut: false })
    .run()
}

export async function getActiveBetById(
  id: string | undefined,
): Promise<ActiveBetType | null> {
  return await ActiveBet.get(id).run()
}

export async function getActiveBetsForGameNotClosedOut(gameId: string) {
  return await ActiveBet.getAll(gameId, { index: 'gameId' })
    .filter({ closedOut: false })
    .run()
}

/**
 * Updates on non cashed out bets
 */
export async function betUpdateFeedForGameId(
  gameId: string,
  callbackFunction: (activeBet: ActiveBetType) => void,
) {
  /*
   * DO NOT USE THE RECURSIVE BET FEED HANDLER FOR THIS ONE
   * IT WILL MAKE A SHIT TON OF BETS
   */
  const cursor = await ActiveBet.getAll(gameId, { index: 'gameId' })
    .changes()
    .run()

  cursor.each(async (_: unknown, change: ChangeEvent<ActiveBetType>) => {
    if (change && change.new_val) {
      callbackFunction(change.new_val)
    }
  })
  return cursor
}

export async function updateActiveBetForUser(
  userId: string,
  betId: string,
  updateFields: Partial<ActiveBetType>,
) {
  const results = await ActiveBet.getAll(betId)
    .filter({ userId })
    .update(updateFields)
    .run()
  if (!results.replaced) {
    throw new APIValidationError('bet__closed', [betId])
  }
  return results
}

export async function updateActiveBet(
  betId: string,
  updateFields: Partial<ActiveBetType>,
) {
  const results = await ActiveBet.getAll(betId).update(updateFields).run()
  if (!results.replaced) {
    throw new APIValidationError('bet__closed', [betId])
  }
  return results
}

export async function prepareAndCloseoutActiveBet(
  activeBet: ActiveBetType,
  deleteAfterRecord = true,
  balanceUpdateTimestamp: Date = new Date(),
): Promise<BetHistory> {
  const activeBetId = activeBet.id

  const betHistoryToRecord: BetHistory = {
    ...activeBet,
    betId: activeBet.id,
    won: activeBet.payoutValue ? activeBet.payoutValue > 0 : false,
    profit: (activeBet.payoutValue ?? 0) - activeBet.betAmount,
    attempts: 0,
    closedOut: true,
    paidOut: false,
    ranHooks: false,
    closeoutComplete: false,
    deleteAfterRecord,
  }

  const updateResult = await ActiveBet.get(activeBetId)
    .update({
      preparingCloseout: true,
    })
    .run()

  // Early return if we did not update the record.
  if (updateResult.replaced !== 1) {
    return betHistoryToRecord
  }

  if ((betHistoryToRecord.profit ?? 0) > config.bet.maxProfit) {
    betHistoryToRecord.payoutValue =
      parseFloat(`${config.bet.maxProfit}`) + activeBet.betAmount
    betHistoryToRecord.profit = config.bet.maxProfit
  }

  const betHistory = await recordAndReturnBetHistory(betHistoryToRecord)

  await ActiveBet.get(activeBet.id).update(betHistoryToRecord).run()

  closeOutBet(betHistory, balanceUpdateTimestamp)

  return betHistory
}

/**
 * The default feed for Active Bets - opt in on a per-game basis.
 * Crash does not use it because Crash needs to be optimized.
 */
async function optInBetFeed() {
  const newFeed = () => {
    return ActiveBet.getAll('roulette', { index: 'gameName' }).changes().run()
  }

  const handleChange = (change: ChangeEvent<ActiveBetType>) => {
    if (change && change.new_val) {
      const { gameName } = change.new_val
      const eventName =
        gameName === 'roulette' ? 'newRouletteBet' : 'newActiveBet'
      emitSocketEventForGame(gameName, eventName, change.new_val)
    }
  }

  const opts = {
    ...config.rethinkdb.changefeedReconnectOptions,
    changefeedName: 'active_bet:roulette',
    logger: winston,
  }

  await recursiveChangefeedHandler<ActiveBetType>(newFeed, handleChange, opts)
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'active_bet',
  indices: [
    { name: 'timestamp' },
    { name: 'gameId' },
    { name: 'gameName' },
    { name: 'userId' },
    { name: 'userId__timestamp', cols: p => [p('userId'), p('timestamp')] },
    { name: 'userId__gameId', cols: p => [p('userId'), p('gameId')] },
  ],
  feeds: [optInBetFeed],
}
