import { recordAndReturnBetHistory } from 'src/modules/bet'
import {
  getActiveBets,
  type ActiveBet,
} from 'src/modules/bet/documents/activeBetsMongo'
import { afterBetHooks } from 'src/modules/bet/lib/hooks'
import { type BetHistory } from 'src/modules/bet/types'
import { getGame } from 'src/modules/tp-games/documents/games'
import { getUserForDisplay } from 'src/modules/user'
import {
  getBalanceFromUserAndType,
  getSelectedBalanceFromUser,
} from 'src/modules/user/balance'
import { type User } from 'src/modules/user/types'
import { r } from 'src/system'
import { SlotegratorError } from '..'
import { getGameEdge } from 'src/modules/game'
import {
  isDisplayCurrency,
  type DisplayCurrency,
} from 'src/modules/user/types/DisplayCurrency'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'
import { slotegratorLogger } from './logger'

export interface CloseoutBetRequest {
  amount: number
  gameName?: string
}

const roundBalance = (num: number) => Math.floor(num * 10000) / 10000

export const getBalanceFromUser = async ({
  user,
  activeBet,
  externalSessionId,
  currency,
}: {
  user: User
  activeBet?: ActiveBet
  externalSessionId?: string
  currency?: DisplayCurrency
}): Promise<number> => {
  // If we know about an active bet, use that balance type.
  const balanceReturn = async () => {
    if (activeBet?.selectedBalanceType) {
      const { balance } = await getBalanceFromUserAndType({
        user,
        balanceType: activeBet.selectedBalanceType,
      })

      return balance
    }

    // If we have a sessionId, use the currency from one of the records.
    if (externalSessionId) {
      const existingBets = await getActiveBets({
        externalSessionId,
        userId: user.id,
        selectedBalanceType: { $exists: true },
      })

      if (existingBets[0]?.selectedBalanceType) {
        const { balance } = await getBalanceFromUserAndType({
          user,
          balanceType: existingBets[0].selectedBalanceType,
        })

        return balance
      }
    }

    // Fall back to currently selected balance.
    const { balance } = await getSelectedBalanceFromUser({ user })

    return balance
  }

  const balance = currency
    ? await currencyExchange(await balanceReturn(), currency, true)
    : await balanceReturn()

  return roundBalance(balance)
}

/**
 * Closeout bet by writing to applicable collections, and running after-bet hooks.
 *
 * The typing for many of these subroutines is incorrect, and are being
 * ignored with @ts-expect-error.
 */
export const recordAndCloseoutBet = async (
  request: CloseoutBetRequest,
  activeBet: ActiveBet,
  user: User,
) => {
  const tpGame = await getGame({ identifier: activeBet.gameIdentifier })

  if (!tpGame) {
    throw new SlotegratorError('Unknown error')
  }

  const bet: BetHistory = {
    thirdParty: 'slotegrator',
    betAmount: activeBet.amount ?? 0,
    won: request.amount > 0,
    gameSessionId: activeBet._id.toString(),
    gameIdentifier: tpGame.identifier,
    payoutValue: request.amount ?? 0,
    // @ts-expect-error We've not properly enumerated what a gameName is
    gameName: request.gameName ?? 'slotegrator',
    profit: (request.amount ?? 0) - (activeBet.amount ?? 0),
    balanceType: activeBet.selectedBalanceType ?? 'crypto',
    user: !activeBet.incognito ? await getUserForDisplay(user) : null,
    userId: user.id,
    betId: `SLOTEGRATOR-${activeBet._id.toString()}`,
    timestamp: r.now(), // TODO don't do this, this value gets used in afterbethooks
    gameNameDisplay: tpGame.title,
    incognito: activeBet.incognito,
    twoFactor: !!(user.twofactorEnabled || user.emailVerified),
  }

  recordAndReturnBetHistory(bet)
    .then(betHistory => {
      afterBetHooks({
        user,
        betHistory,
        edge: getGameEdge(tpGame.title, tpGame.payout),
      })
    })
    .catch(error => {
      slotegratorLogger('recordAndCloseoutBet', { userId: user.id }).error(
        'error recording bet history',
        {},
        error,
      )
    })
}

export const displayCurrencyToCurrencyCode = (toConvert: string): string => {
  return toConvert.toUpperCase()
}

export const currencyCodeToDisplayCurrency = (toConvert: string): string => {
  return toConvert.toLowerCase()
}

export const serializeRequestCurrency = (
  currency: string | null | undefined,
): DisplayCurrency | null => {
  if (!currency) {
    return null
  }
  const requestCurrency = currencyCodeToDisplayCurrency(currency)
  if (!isDisplayCurrency(requestCurrency)) {
    return null
  }
  return requestCurrency
}
