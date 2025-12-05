import { getActiveBet } from 'src/modules/bet/documents/activeBetsMongo'
import { creditBalance, deductFromBalance } from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { scopedLogger } from 'src/system/logger'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'

import { getAction } from '../../documents/hacksawActions'
import { type HacksawEvent } from '../actions'
import { HacksawErrorCodes, HacksawError } from '../errors'
import { getBetIdentifier, formatUserBalance } from '../helpers'
import { requestCurrencyHandler } from '../currencies'

interface FreespinRoundData {
  freeRoundActivationId: number
  campaignId: string
  offerId: string
  freeRoundsRemaining: number
  freespinValue: number
}

export interface RollbackRequest {
  action: 'Rollback'
  secret: string
  externalPlayerId: string
  amount: number
  currency: string
  roundId: number
  gameId: number
  gameSessionId: number
  transactionId: number // for the rollback itself
  rolledBackTransactionId: number // txnid to be rolled back
  ended: boolean
  freespinRoundData?: FreespinRoundData
  externalSessionId: string
}

interface RollbackResponse {
  accountBalance: number
  externalTransactionId?: string
  statusCode: number
  statusMessage: string
}

const hacksawLogger = scopedLogger('hacksaw')

/**
 * Rollback partial or all balance. A rollback is only ever called
 * after a win has been processed.
 */
export const ROLLBACK_EVENT: HacksawEvent<RollbackRequest, RollbackResponse> = {
  resolveAction: async request => {
    const targetAction = await getAction({
      transactionId: getBetIdentifier(request),
    })
    return {
      action: request.action,
      roundId: request.roundId.toString(),
      gameIdentifier: request.gameId.toString(),
      betIdentifier: getBetIdentifier(request),
      transactionId: request.transactionId.toString(),
      amount: request.amount / 100,
      currency: request.currency,
      targetActionBetIdentifier: targetAction?.betIdentifier,
      targetActionType: targetAction?.action,
    }
  },

  process: async (request, action, user) => {
    if (!action.targetActionBetIdentifier) {
      // believe it or not, it actually wants you to succeed in this case
      return null
    }
    const activeBet = await getActiveBet({
      externalIdentifier: action.targetActionBetIdentifier,
    })

    if (!activeBet) {
      // believe it or not, it actually wants you to succeed in this case
      return null
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

    const amountUSD = await currencyExchange(action.amount, displayCurrency)
    const logger = hacksawLogger('ROLLBACK_EVENT.process', { userId: user.id })

    if (action.targetActionType === 'Bet') {
      // Credit user and create payout transaction record if amount is > 0.
      const transMeta: TransactionMeta['refund'] = {
        provider: 'hacksaw',
        transactionId: request.transactionId,
        betIdentifier: action.targetActionBetIdentifier,
        activeBetId: activeBet._id.toString(),
        gameIdentifiers: {
          aggregator: 'hacksaw',
          gid: request.gameId.toString(),
        },
      }

      const conversionInfo = `Display currency of ${action.amount} ${displayCurrency} converted to ${amountUSD} USD`
      logger.info('transaction', { ...transMeta, conversionInfo })

      const payoutResult = await creditBalance({
        user,
        amount: amountUSD,
        meta: transMeta,
        transactionType: 'refund',
        balanceTypeOverride: activeBet.selectedBalanceType ?? null,
      })

      if (!payoutResult.transactionId) {
        throw new HacksawError('Failed to credit user for win.')
      }
    } else if (action.targetActionType === 'Win') {
      const takeBalanceMeta: TransactionMeta['winRollback'] = {
        provider: 'hacksaw',
        transactionId: request.rolledBackTransactionId,
        parentTransactionId: request.transactionId,
        externalIdentifier: getBetIdentifier(request),
        gameIdentifiers: {
          aggregator: 'hacksaw',
          gid: request.gameId.toString(),
        },
      }

      const conversionInfo = `Display currency of ${action.amount} ${displayCurrency} converted to ${amountUSD} USD`
      logger.info('transaction', { ...takeBalanceMeta, conversionInfo })

      const takeBalance = await deductFromBalance({
        user,
        amount: amountUSD,
        transactionType: 'winRollback',
        balanceTypeOverride: activeBet?.selectedBalanceType ?? null,
        meta: takeBalanceMeta,
      })

      if (!takeBalance.transactionId) {
        throw new HacksawError('Failed to take balance from user.')
      }
    }
    return null
  },

  resolveResponse: async (request, action, user) => {
    const displayCurrency = requestCurrencyHandler(
      request.currency,
    ) as DisplayCurrency
    return {
      externalTransactionId: action._id.toString(),
      accountBalance: await formatUserBalance(user, displayCurrency),
      statusCode: HacksawErrorCodes.Success,
      statusMessage: '',
    }
  },
}
