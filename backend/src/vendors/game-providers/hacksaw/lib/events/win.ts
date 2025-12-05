import { recordAndReturnBetHistory } from 'src/modules/bet'
import {
  updateActiveBet,
  type ActiveBet,
} from 'src/modules/bet/documents/activeBetsMongo'
import { getActiveBet } from 'src/modules/bet/documents/activeBetsMongo'
import { afterBetHooks } from 'src/modules/bet/lib/hooks'
import { type BetHistory } from 'src/modules/bet/types'
import {
  getGame,
  updateGame as updateProviderGame,
} from 'src/modules/tp-games/documents/games'
import { getUserForDisplay } from 'src/modules/user'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { creditBalance } from 'src/modules/user/balance'
import { type User } from 'src/modules/user/types'
import { r } from 'src/system'
import { getGameEdge } from 'src/modules/game'
import { preventOverMaxPayout } from 'src/modules/bet/util'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'

import { type HacksawAction } from '../../documents/hacksawActions'
import { type HacksawEvent } from '../actions'
import { HacksawError, HacksawErrorCodes } from '../errors'
import { getBetIdentifier, formatUserBalance } from '../helpers'
import { requestCurrencyHandler } from '../currencies'
import { hacksawLogger } from '../logger'

interface FreeRoundData {
  freeRoundActivationId: number
  campaignId?: number
  freeRoundsRemaining: number
  offerId?: number
}

export interface WinRequest {
  action: 'Win'
  secret: string
  externalPlayerId: string
  amount: number
  currency: string
  roundId: number
  gameId: number
  gameSessionId: number
  externalSessionId: string
  transactionId: number
  type: 'real' | 'free'
  freeRoundData?: FreeRoundData
  jackpotAmount: number
  ended: boolean
  betTransactionId: number
}

interface WinResponse {
  accountBalance: number
  externalTransactionId?: string
  statusCode: number
  statusMessage: string
}

/**
 * Closeout bet by writing to applicable collections, and running after-bet hooks.
 *
 * The typing for many of these subroutines is incorrect, and are being
 * ignored with @ts-expect-error.
 */
const recordAndCloseoutBet = async (
  request: WinRequest,
  action: HacksawAction,
  activeBet: ActiveBet,
  user: User,
) => {
  const tpGame = await getGame({ identifier: activeBet.gameIdentifier })
  if (!tpGame) {
    throw new HacksawError('Unknown error')
  }

  const requestCurrency = requestCurrencyHandler(request.currency)

  if (!requestCurrency) {
    throw new HacksawError(
      'Invalid currency provided.',
      HacksawErrorCodes.InvalidCurrencyForUser,
    )
  }
  const winningsUSD =
    (await currencyExchange(request.amount, requestCurrency)) / 100 // format to '0.00' for betHistory

  const bet: BetHistory = {
    thirdParty: 'hacksaw',
    betAmount: activeBet.amount ?? 0,
    won: action.amount > 0,
    gameSessionId: activeBet._id.toString(),
    gameIdentifier: tpGame.identifier,
    payoutValue: winningsUSD ?? 0,
    // @ts-expect-error We've not properly enumerated what a gameName is
    gameName: 'hacksaw',
    profit: (winningsUSD ?? 0) - (activeBet.amount ?? 0),
    balanceType: activeBet.selectedBalanceType ?? 'crypto',
    user: !activeBet.incognito ? await getUserForDisplay(user) : null,
    userId: user.id,
    betId: `hacksaw-${activeBet._id.toString()}`,
    timestamp: r.now(), // TODO don't do this, this value gets used in afterbethooks
    gameNameDisplay: tpGame.title,
    incognito: activeBet.incognito,
    twoFactor: !!(user.twofactorEnabled || user.emailVerified),
    closedOut: !!request.ended,
    category: tpGame.category,
  }

  await updateActiveBet(activeBet._id, {
    closedOut: request.ended ? new Date() : undefined,
  })

  // TODO: Create a function in tp-games -> documents -> games.ts, ex: updateGamePopularity, that handles this update.
  // The $inc portion should be handled in the function itself, and should only take in an identifier and the betAmount.
  // Use this new function in other places we use updateProviderGame to update game popularity.
  updateProviderGame(
    { identifier: tpGame.identifier },
    {
      $inc: {
        popularity: activeBet.amount || 0,
      },
    },
  )

  recordAndReturnBetHistory(bet)
    .then(betHistory => {
      afterBetHooks({
        user,
        betHistory,
        edge: getGameEdge(tpGame.title, tpGame.payout),
      })
    })
    .catch(error => {
      hacksawLogger('recordAndCloseoutBet', { userId: user.id }).error(
        'error recording bet history',
        {},
        error,
      )
    })
}

export const WIN_EVENT: HacksawEvent<WinRequest, WinResponse> = {
  resolveAction: async (request, user) => ({
    action: request.action,
    roundId: request.roundId.toString(),
    betIdentifier: getBetIdentifier(request),
    gameIdentifier: request.gameId.toString(),
    transactionId: request.transactionId.toString(),
    amount: request.amount / 100, // Incoming amounts are in cents.
    currency: request.currency,
  }),

  process: async (request, action, user) => {
    // Lookup current active bet.
    const activeBet = await getActiveBet({
      externalIdentifier: getBetIdentifier(request) || '',
    })

    if (!activeBet) {
      throw new HacksawError('Could not find associated bet.')
    }

    if (activeBet.userId !== user.id) {
      throw new HacksawError('User mismatch.', HacksawErrorCodes.InvalidAction)
    }

    const displayCurrency = requestCurrencyHandler(request.currency)

    if (!displayCurrency) {
      throw new HacksawError(
        'Invalid currency provided.',
        HacksawErrorCodes.InvalidCurrencyForUser,
      )
    }

    const winAmountUSD = await currencyExchange(action.amount, displayCurrency)

    if (winAmountUSD < 0) {
      throw new HacksawError(
        'Cannot credit user less than zero amount.',
        HacksawErrorCodes.InvalidAction,
      )
    }

    if (action.amount === 0) {
      await recordAndCloseoutBet(request, action, activeBet, user)
      // Bet was lost, early return, run hooks but do not credit user or create transition.
      return null
    }

    // Credit user and create payout transaction record if amount is > 0.
    const transMeta: TransactionMeta['payout'] = {
      provider: 'hacksaw',
      transactionId: request.transactionId,
      betIdentifier: getBetIdentifier(request),
      activeBetId: activeBet._id.toString(),
      betId: 'Hacksaw-' + getBetIdentifier(request),
      gameIdentifiers: {
        aggregator: 'hacksaw',
        gid: request.gameId.toString(),
      },
    }

    hacksawLogger('process', { userId: user.id }).debug('conversion info', {
      transMeta,
      amount: action.amount,
      winAmountUSD,
      displayCurrency,
    })

    const overMaxPayout = await preventOverMaxPayout(
      user.id,
      winAmountUSD,
      `hacksaw:${request.gameId.toString()}`,
    )
    let payoutResult: any = {}
    if (!overMaxPayout) {
      await recordAndCloseoutBet(request, action, activeBet, user)

      payoutResult = await creditBalance({
        user,
        amount: winAmountUSD,
        meta: transMeta,
        transactionType: 'payout',
        balanceTypeOverride: activeBet.selectedBalanceType ?? null,
      })
    }

    if (!payoutResult.transactionId) {
      throw new HacksawError('Failed to credit user for win.')
    }
    return null
  },

  resolveResponse: async (request, action, user) => {
    const displayCurrency = requestCurrencyHandler(
      request.currency,
    ) as DisplayCurrency
    return {
      accountBalance: await formatUserBalance(user, displayCurrency),
      externalTransactionId: action._id.toString(),
      statusCode: HacksawErrorCodes.Success,
      statusMessage: '',
    }
  },
}
