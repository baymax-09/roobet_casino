import { placeThirdPartyBet } from 'src/modules/bet'
import { getGame } from 'src/modules/tp-games/documents/games'
import { scopedLogger } from 'src/system/logger'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'

import {
  getGameIdentifier,
  getBetIdentifier,
  formatUserBalance,
} from '../helpers'
import { requestCurrencyHandler } from '../currencies'
import { type HacksawEvent } from '../actions'
import { HacksawError, HacksawErrorCodes } from '../errors'

interface FreespinRoundData {
  freeRoundActivationId: number
  campaignId: string
  offerId: string
  freeRoundsRemaining: number
  freespinValue: number
}

export interface BetRequest {
  action: 'Bet'
  secret: string
  externalPlayerId: string
  amount: number
  currency: string
  roundId: number
  gameId: number
  gameSessionId: number
  transactionId: number
  freespinRoundData?: FreespinRoundData
  externalSessionId: string
}

interface BetResponse {
  accountBalance: number
  externalTransactionId?: string
  statusCode: number
  statusMessage: string
}

const hacksawLogger = scopedLogger('hacksaw')

/**
 * Creates a ActiveBet record and returns the bet id and player balance.
 */
export const BET_EVENT: HacksawEvent<BetRequest, BetResponse> = {
  resolveAction: async (request, user) => ({
    action: request.action,
    amount: request.amount / 100,
    currency: request.currency,
    roundId: request.roundId.toString(),
    gameIdentifier: request.gameId.toString(),
    betIdentifier: getBetIdentifier(request),
    transactionId: request.transactionId.toString(),
    balanceType: user.selectedBalanceType,
  }),

  process: async (request, action, user) => {
    const tpGame = await getGame({
      identifier: getGameIdentifier(request.gameId),
    })

    if (!tpGame) {
      throw new HacksawError('Cannot place bet on non-existent game.')
    }

    const displayCurrency = requestCurrencyHandler(request.currency)

    if (!displayCurrency) {
      throw new HacksawError(
        'Invalid currency provided.',
        HacksawErrorCodes.InvalidCurrencyForUser,
      )
    }

    // Convert amount to functional currency (USD).
    const betAmountUSD = await currencyExchange(action.amount, displayCurrency)

    // Create an ActiveBet record and take balance from user.

    const transMeta = {
      transactionId: request.transactionId.toString(),
      roundId: request.roundId,
      betId: 'Hacksaw-' + getBetIdentifier(request),
    }

    const conversionInfo = `Display currency of ${action.amount} ${displayCurrency} converted to ${betAmountUSD} USD`
    hacksawLogger('BET_EVENT.process', { userId: user.id }).info(
      'transaction',
      { ...transMeta, conversionInfo },
    )

    const betResult = await placeThirdPartyBet({
      user,
      betAmount: betAmountUSD,
      gameIdentifier: tpGame.identifier,
      externalIdentifier: getBetIdentifier(request),
      meta: transMeta,
    })

    if (!betResult.success) {
      throw new HacksawError(
        betResult.message,
        betResult.status === 'insufficient_balance'
          ? HacksawErrorCodes.InsufficientFunds
          : HacksawErrorCodes.GeneralServerError,
      )
    }

    return null
  },

  resolveResponse: async (request, action, user) => {
    // displayCurrency is null checked above, we shouldn't be reaching this point if it's null.
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
