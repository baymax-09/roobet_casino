// TODO move functions out of index
import { config, r } from 'src/system'
import { createUniqueID } from 'src/util/helpers/id'
import { translateForUser } from 'src/util/i18n'
import { checkCanPlaceBetOnGame } from './lib/hooks'
import { getMinBetForGame, getMaxBetForGame } from 'src/modules/game'
import { APIValidationError, LockedProcessError } from 'src/util/errors'
import { type Types as UserTypes } from 'src/modules/user'
import {
  getUserById,
  getUserForDisplay,
  createNotification,
  shouldHideUser,
} from 'src/modules/user'
import { type Types as GameTypes } from 'src/modules/game'
import { type BalanceType } from 'src/modules/user/types'
import { acquireLock, deleteLock } from 'src/util/named-lock'

import {
  convertHouseGameNameToGameIdentifier,
  convertNewHouseGameNameToGameIdentifier,
} from './util'
import { ActiveBet, deleteActiveBetById } from './documents/active_bet'
import { type ActiveBet as ActiveBetType } from './types'

import { type HouseGameName, HouseGameNames } from '../game/types'
import {
  creditBalance,
  deductFromBalance,
  getBalanceFromUserAndType,
} from '../user/balance'
import { getGame } from '../tp-games/documents/games'
import { exchangeAndFormatCurrency } from '../currency/lib/currencyFormat'

export {
  recordAndReturnBetHistory,
  getBetByBetId,
  getBetById,
  hideBetHistory,
  updateBetHistoryForGame,
  getRecentBetHistoryForUser,
  getBetsByGameId,
} from './documents/bet_history_mongo'
export {
  prepareAndCloseoutActiveBet,
  getActiveBetById,
  getActiveBetsForGameNotClosedOut,
  updateActiveBetForUser,
  betUpdateFeedForGameId,
  ActiveBet,
  getActiveBetsForGame,
  deleteActiveBetById,
  deleteAllActiveBetsForGameId,
} from './documents/active_bet'

export * as Documents from './documents'
export * as Routes from './routes'
export * as Workers from './workers'
export * as Types from './types'
export * from './lib'
export * from './util'

// This should be in the inverse, instead of omitting fields for the 'extra params',
// just keep a running list.
type OmittedActiveBetFields =
  | 'balanceType'
  | 'closedOut'
  | 'gameId'
  | 'gameName'
  | 'gameIdentifier'
  | 'userId'
  | 'type'
  | 'hidden'
  | 'betAmount'
  | 'highroller'
  | 'timestamp'
  | 'incognito'
  | 'twoFactor'
  | 'user'

export interface PreBetValidationArgs {
  user: UserTypes.User
  game: Omit<GameTypes.ActiveGame, 'userId'>
  betAmount: number
  balanceTypeOverride?: BalanceType | null
  freeBetItemId?: string
}

export interface PlaceBetArgs extends PreBetValidationArgs {
  extraBetFields: Omit<Partial<ActiveBetType>, OmittedActiveBetFields>
}

const isValidHouseGameName = (gameName?: string): gameName is HouseGameName => {
  return !!(
    gameName && (HouseGameNames as readonly string[]).includes(gameName)
  )
}

// This is used by crash, hotbox, and coinflip
export async function refundBet(
  bet: ActiveBetType,
  gameName: HouseGameName,
): Promise<void> {
  if (bet.closedOut) {
    throw new APIValidationError('bet__closed', [bet.id])
  }
  const user = await getUserById(bet.userId)
  if (!user) {
    throw new APIValidationError('user__does_not_exist', [bet.userId])
  }

  await creditBalance({
    user,
    amount: bet.betAmount,
    meta: {
      provider: 'roobet',
      gameIdentifiers: { gameName },
    },
    transactionType: 'refund',
    balanceTypeOverride: bet.balanceType,
  })
  const message = translateForUser(user, 'bet__refund')
  await createNotification(user.id, message, 'refund')
  await deleteActiveBetById(bet.id)
}

/**
 * @deprecated Use MutexLock instead.
 */
async function basicLockedProcess<T>(
  lockKey: string,
  ttl: number,
  errorMessage: string,
  processFcn: () => Promise<T>,
): Promise<T> {
  const lockArr = [lockKey]
  try {
    await acquireLock(lockArr, ttl * 1000)
    const result = await processFcn()
    await deleteLock(lockArr)
    return result
  } catch (error) {
    if (error instanceof LockedProcessError) {
      throw new APIValidationError(errorMessage)
    } else {
      await deleteLock(lockArr)
      throw error
    }
  }
}

/**
 * Validates the bet and the user's balance before placing the bet.
 *
 * @TODO: All house games should be refactored to call this before generating provably fair info,
 * and the validation logic should be taken out of placeBet.
 */
export async function preBetValidation({
  user,
  game,
  betAmount,
  balanceTypeOverride,
}: PreBetValidationArgs): Promise<
  { success: true } | { success: false; message: string; args?: string[] }
> {
  const { gameName } = game

  if (!isValidHouseGameName(gameName)) {
    return { success: false, message: 'Invalid game.' }
  }

  if (isNaN(betAmount)) {
    return { success: false, message: 'bet__invalid' }
  }

  if (betAmount < getMinBetForGame(gameName)) {
    const convertedMin = await exchangeAndFormatCurrency(
      getMinBetForGame(gameName),
      user,
    )
    return {
      success: false,
      message: 'bet__convertedMinimum_bet',
      args: [`${convertedMin}`],
    }
  }

  if (betAmount > getMaxBetForGame(gameName)) {
    const convertedMax = await exchangeAndFormatCurrency(
      getMaxBetForGame(gameName),
      user,
    )
    return {
      success: false,
      message: 'bet__convertedMaximum_bet',
      args: [`${convertedMax}`],
    }
  }

  const gameIdentifier = convertHouseGameNameToGameIdentifier(gameName)
  const gameDocument = await getGame({ identifier: gameIdentifier })

  // Use balance override if specified, or default to user's currently selected balance.
  const balanceType = balanceTypeOverride ?? user.selectedBalanceType

  const { canPlaceBet, reason } = await checkCanPlaceBetOnGame(
    user,
    gameIdentifier,
    gameDocument,
    balanceType,
  )
  if (!canPlaceBet) {
    return { success: false, message: reason }
  }

  const balanceReturn = await getBalanceFromUserAndType({
    user,
    balanceType,
  })

  if (balanceReturn.balance <= 0) {
    return { success: false, message: 'bet__not_enough_balance' }
  }

  return { success: true }
}

/**
 * If you want the bet to be replace-able, just specify an `id` field with a unique id
 * for the bet. Otherwise the bet will only be able to happen once per user.
 */
export async function placeBet({
  user,
  game,
  betAmount,
  extraBetFields,
  balanceTypeOverride,
}: PlaceBetArgs): Promise<ActiveBetType> {
  return await basicLockedProcess(
    `${user.id}-inventory`,
    5,
    'inventory__locked',
    async function () {
      const { gameName } = game

      if (!isValidHouseGameName(gameName)) {
        throw new APIValidationError('Invalid game.')
      }

      if (!extraBetFields.id) {
        extraBetFields.id = createUniqueID([game.id, user.id])
      }

      // --- Note: Commenting out the free bet code since we're not using atm ---
      // const { freeBet, freeBetType, newBetAmount } = await useFreeBet(freeBetItemId, betAmount, game.gameName)

      // betAmount = newBetAmount ?? betAmount

      if (isNaN(betAmount)) {
        throw new APIValidationError('bet__invalid')
      }

      if (betAmount < getMinBetForGame(gameName)) {
        const convertedMin = await exchangeAndFormatCurrency(
          getMinBetForGame(gameName),
          user,
        )
        throw new APIValidationError('bet__convertedMinimum_bet', [
          `${convertedMin}`,
        ])
      }

      if (betAmount > getMaxBetForGame(gameName)) {
        const convertedMax = await exchangeAndFormatCurrency(
          getMaxBetForGame(gameName),
          user,
        )
        throw new APIValidationError('bet__convertedMaximum_bet', [
          `${convertedMax}`,
        ])
      }

      const gameIdentifier = convertHouseGameNameToGameIdentifier(gameName)
      const gameDocument = await getGame({ identifier: gameIdentifier })

      // Use balance override if specified, or default to user's currently selected balance.
      const balanceType = balanceTypeOverride ?? user.selectedBalanceType

      const { canPlaceBet, reason } = await checkCanPlaceBetOnGame(
        user,
        gameIdentifier,
        gameDocument,
        balanceType,
      )
      if (!canPlaceBet) {
        throw new APIValidationError(reason)
      }

      const balanceReturn = await getBalanceFromUserAndType({
        user,
        balanceType,
      })

      if (balanceReturn.balance <= 0) {
        throw new APIValidationError('bet__not_enough_balance')
      }

      await deductFromBalance({
        user,
        amount: betAmount,
        transactionType: 'bet',
        balanceTypeOverride: balanceReturn.balanceType,
        meta: {
          provider: 'roobet',
          betId: extraBetFields.id,
          gameIdentifiers: { gameName: game.gameName as HouseGameName },
        },
      })

      const incognito = await shouldHideUser(user)

      const bet: Omit<ActiveBetType, 'id'> = {
        balanceType: balanceReturn.balanceType,
        closedOut: false,
        gameId: game.id,
        gameName,
        // We only record the real gameIdentifier for new house games.
        gameIdentifier: convertNewHouseGameNameToGameIdentifier(gameName),
        userId: user.id,
        betAmount: r.row('betAmount').add(betAmount).default(betAmount),
        highroller: betAmount > 100,
        timestamp: r.now(),
        incognito,
        twoFactor: !!(user.twofactorEnabled || user.emailVerified),
        user: !incognito ? await getUserForDisplay(user) : null,
        ...extraBetFields,
      }

      const result = await ActiveBet.get(extraBetFields.id)
        .replace(bet, { returnChanges: true })
        .run()
      const dbBet = result.changes[0].new_val

      if (game.maxBet && dbBet.betAmount > game.maxBet) {
        await creditBalance({
          user,
          amount: betAmount,
          meta: {
            provider: 'roobet',
            gameIdentifiers: { gameName: game.gameName as HouseGameName },
          },
          transactionType: 'refund',
          balanceTypeOverride: balanceReturn.balanceType,
        })

        await ActiveBet.get(extraBetFields.id)
          .update({ betAmount: r.row('betAmount').sub(betAmount) })
          .run()

        const convertedMax = await exchangeAndFormatCurrency(
          config.roulette.maxBet,
          user,
        )

        throw new APIValidationError('bet__convertedMaximum_bet', [
          `${convertedMax}`,
        ])
      }

      return dbBet
    },
  )
}
