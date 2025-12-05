import { Types } from 'mongoose'

import { creditBalance } from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'

import { type SlotegratorSlotsEvent } from '../actions'
import {
  SlotegratorError,
  getBalanceFromUser,
  serializeRequestCurrency,
} from '../../../common'
import {
  getAction,
  updateAction,
} from '../../documents/slotegratorSlotsActions'
import { scopedLogger } from 'src/system/logger'
import { updateOpenActiveBet } from 'src/modules/bet/documents/activeBetsMongo'

const slotegratorRefundLogger = scopedLogger('slotegratorSlots-refund')

export interface RefundRequest {
  action: 'refund'
  amount: number
  currency: string
  game_uuid: string
  player_id: string
  transaction_id: string
  session_id: string
  type?: 'bet' | 'tip' | 'freespin'
  bet_transaction_id: string
  freespin_id?: string
  quantity?: number
  round_id?: string
  finished?: boolean
}

export interface RefundResponse {
  balance: number
  transaction_id: string
}

/**
 * Refund balance before a bet is closed out.
 */
export const REFUND_EVENT: SlotegratorSlotsEvent<
  RefundRequest,
  RefundResponse
> = {
  resolveAction: async request => {
    const roundId = await (async () => {
      if (request.round_id) {
        return request.round_id
      }

      const betAction = await getAction({
        action: 'bet',
        externalTransactionId: request.bet_transaction_id,
      })

      if (betAction) {
        return betAction.roundId
      }

      // Refund requests should never be rejected because in theory the above
      // information is always available. If these requests are rejected in
      // a production environment, start here when debugging.
      return undefined
    })()

    return {
      action: request.action,
      amount: request.amount,
      roundId,
      gameId: request.game_uuid,
      userId: request.player_id,
      sessionId: request.session_id,
      externalTransactionId: request.transaction_id,
      externalBetTransactionId: request.bet_transaction_id,
    }
  },

  process: async (request, action, user, activeBet) => {
    const logger = slotegratorRefundLogger('processWin', {
      userId: request.player_id,
    })

    // Slotegrator may send refunds without bets.
    const existingBetAction = await getAction({
      externalTransactionId: request.bet_transaction_id,
      action: 'bet',
    })

    if (!existingBetAction) {
      // Early return, do not credit the user.
      return
    }

    // Slotegrator may send multiple refunds with different transaction IDs.
    const existingRefundAction = await getAction({
      _id: { $ne: new Types.ObjectId(action._id) },
      externalBetTransactionId: request.bet_transaction_id,
      action: 'refund',
    })

    if (existingRefundAction) {
      // Early return, do not credit the user.
      return
    }

    // Mark active bet as closed out, and verify another process has not already
    // processed the closure and payout.
    const closedActiveBet = await updateOpenActiveBet(activeBet._id, {
      closedOut: new Date(),
    })

    // If the bet was already closed, do not process.
    if (!closedActiveBet) {
      throw new SlotegratorError(
        'Cannot process refund for already closed bet.',
      )
    }

    const refundCurrency = serializeRequestCurrency(request.currency)

    if (!refundCurrency) {
      throw new SlotegratorError('Invalid currency.')
    }

    // Credit user for the amount refunded.
    const transMeta: TransactionMeta['refund'] = {
      provider: 'slotegrator',
      providerBetId: request.round_id,
      activeBetId: activeBet._id.toString(),
      gameIdentifiers: { identifier: activeBet.gameIdentifier },
    }

    const refundAmountUSD = await currencyExchange(
      request.amount,
      refundCurrency,
    )

    const conversionInfo = `${request.amount} ${request.currency} converted to ${refundAmountUSD} USD`

    // Credit user and create refund transaction record.
    const refundResult = await creditBalance({
      user,
      amount: refundAmountUSD,
      meta: transMeta,
      transactionType: 'refund',
      balanceTypeOverride: activeBet.selectedBalanceType ?? null,
    })

    if (!refundResult.transactionId) {
      throw new SlotegratorError('Failed to credit user for refund.')
    }

    logger.info('processRefund', {
      amount: refundAmountUSD,
      transactionId: refundResult.transactionId,
      conversionInfo,
      transactionMeta: transMeta,
    })

    // Update action document.
    await updateAction(action._id, {
      transactionId: refundResult.transactionId,
    })
  },

  resolveResponse: async (request, action, user, activeBet) => {
    const returnCurrency = serializeRequestCurrency(request.currency)!
    return {
      balance: await getBalanceFromUser({
        user,
        activeBet,
        currency: returnCurrency,
      }),
      transaction_id: action.transactionId ?? action._id.toString(),
    }
  },
}
