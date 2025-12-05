import { GraphQLError } from 'graphql'

import { issueFreespins } from 'src/vendors/game-providers/softswiss/lib/api'
import { createVariableFrb } from 'src/vendors/game-providers/pragmatic/lib/api'
import { issueBonus } from 'src/vendors/game-providers/hacksaw/lib/bonuses'
import { type FreespinIssuer } from 'src/modules/tp-games'

import { type HouseInventoryItem, type DBUserInventoryItem } from '../lib'
import {
  type ErrorFreeSpins,
  type FreeSpin,
  type FreeSpinsBuffSettings,
} from '../documents/types'
import { PRAGMATIC_SPIN_AMOUNT_VALUES } from './pragmaticSpinAmountValues'

/**
 * @param freespinsItems These free spin items are being consumed right away. We need to give the user free spins, for
 * all games attached, for each one of these items.
 */
export const createUserFreeSpins = async (
  freeSpinItems: DBUserInventoryItem[],
  currentHouseItem: HouseInventoryItem,
  userId: string,
  errorsFreeSpins: ErrorFreeSpins,
  issuerId: FreespinIssuer,
  reason: string,
) => {
  const freeSpins = getGamesForFreeSpinBuff(currentHouseItem)
  if (!freeSpins.length) {
    return
  }

  for (const freeSpin of freeSpins) {
    const aggregator = freeSpin.tpGameAggregator
    if (aggregator === 'softswiss') {
      await createFreeSpinsSoftswiss(
        freeSpinItems,
        userId,
        freeSpin,
        errorsFreeSpins,
        issuerId,
        reason,
      )
    } else if (aggregator === 'pragmatic') {
      await createFreeSpinsPragmatic(
        freeSpinItems,
        userId,
        freeSpin,
        errorsFreeSpins,
        issuerId,
        reason,
      )
    } else if (aggregator === 'hacksaw') {
      await createFreeSpinsHacksaw(
        freeSpinItems,
        userId,
        freeSpin,
        errorsFreeSpins,
        issuerId,
        reason,
      )
    }
  }
}

const getGamesForFreeSpinBuff = (currentHouseItem: HouseInventoryItem) => {
  // TODO: Fix this type casting, use a type guard.
  const freeSpinBuffSettings = currentHouseItem.buff
    .buffSettings as FreeSpinsBuffSettings
  if (!freeSpinBuffSettings.freeSpins) {
    return []
  }
  return freeSpinBuffSettings.freeSpins
}

const createFreeSpinsHacksaw = async (
  freeSpinItems: DBUserInventoryItem[],
  userId: string,
  freeSpin: FreeSpin,
  errorsFreeSpins: ErrorFreeSpins,
  issuerId: FreespinIssuer,
  reason: string,
) => {
  // Ex: gameIdentifier: hacksaw: 1172. We only need the 1172 portion.
  const games: string[] = freeSpin.games.map(
    game => game.identifier.split(':')[1],
  )

  const promises: Array<Promise<any>> = []
  for (const _ of freeSpinItems) {
    for (const gid of games) {
      promises.push(
        issueBonus({
          userId,
          amount: freeSpin.spinAmount,
          rounds: freeSpin.numberOfSpins,
          gameId: gid,
          errorsFreeSpins,
          sendNotification: false,
          issuerId,
          reason,
        }),
      )
    }
  }

  return await Promise.all(promises)
}

const createFreeSpinsSoftswiss = async (
  freeSpinItems: DBUserInventoryItem[],
  userId: string,
  freeSpin: FreeSpin,
  errorsFreeSpins: ErrorFreeSpins,
  issuerId: FreespinIssuer,
  reason: string,
) => {
  const games: string[] = freeSpin.games.map(game => game.identifier)

  // If "validUntil" is the same, it will overwrite the data. Therefore, we need to
  // ensure that the "validUntil" parameter will be different for all calls.
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 30)

  const promises = freeSpinItems.map(async (_, index) => {
    validUntil.setMilliseconds(validUntil.getMilliseconds() + index * 10)
    await issueFreespins(
      userId,
      games.join(','),
      freeSpin.numberOfSpins,
      freeSpin.spinAmount,
      validUntil.toISOString(),
      issuerId,
      reason,
      errorsFreeSpins,
      false,
    )
  })

  return await Promise.all(promises)
}

const createFreeSpinsPragmatic = async (
  freeSpinItems: DBUserInventoryItem[],
  userId: string,
  freeSpin: FreeSpin,
  errorsFreeSpins: ErrorFreeSpins,
  issuerId: FreespinIssuer,
  reason: string,
) => {
  const games: string[] = freeSpin.games.map(game =>
    game.pragmaticGameId ? game.pragmaticGameId : '',
  )

  if (!PRAGMATIC_SPIN_AMOUNT_VALUES.has(freeSpin.spinAmount)) {
    throw new GraphQLError(
      'Not a valid free spin bet amount for pragmatic game.',
      {},
    )
  }

  const promises: Array<Promise<any>> = []
  for (const _ of freeSpinItems) {
    for (const gid of games) {
      promises.push(
        createVariableFrb({
          userId,
          rounds: freeSpin.numberOfSpins,
          periodOfTime: 0,
          gameId: gid,
          frType: null,
          betPerRound: freeSpin.spinAmount,
          logTransaction: true,
          errorsFreeSpins,
          sendNotification: false,
          reason,
          issuerId,
        }),
      )
    }
  }
  return await Promise.all(promises)
}
