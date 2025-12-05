import { creditBalance } from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'

import { type SlotegratorEvent } from '../actions'
import { SlotegratorError, getBalanceFromUser } from '../../../common'
import { getAction, updateAction } from '../../documents/slotegratorActions'

export interface RefundRequest {
  action: 'refund'
  amount: number
  betslip_id: string
  currency: string
  player_id: string
  // This is the transaction ID of the bet, not sure what the other is...
  ref_transaction_id: string
  session_id: string
  sportsbook_uuid: string
  // This is NOT the bet transaction id.
  transaction_id: string
  type: 'default' | 'cash_out' | 'reject'
}

export interface RefundResponse {
  balance: number
  transaction_id: string
}

/**
 * Refund balance before a bet is closed out.
 */
export const REFUND_EVENT: SlotegratorEvent<RefundRequest, RefundResponse> = {
  resolveAction: request => ({
    action: request.action,
    betslipId: request.betslip_id,
    externalTransactionId: request.transaction_id,
    userId: request.player_id,
    amount: request.amount,
  }),

  process: async ({ request, action, user, activeBet }) => {
    // Slotegrator may send refunds without bets. See the README for more information.
    const existingBetAction = await getAction({
      betslipId: request.betslip_id,
      action: 'bet',
    })

    if (!existingBetAction) {
      // Update action document to indicate a 0 amount was refunded.
      await updateAction(action._id, {
        amount: 0,
      })

      // Early return, do not credit the user.
      return
    }

    const refundType = (() => {
      switch (request.type) {
        case 'default':
          return 'refund'
        case 'cash_out':
          return 'cash_out'
        case 'reject':
          return 'reject'
        // Add additional explicit types here.
        default:
          return null
      }
    })()

    // Credit user for the amount refunded.
    const transMeta: TransactionMeta['refund'] = {
      provider: 'slotegrator',
      providerBetId: activeBet.meta?.betslip.provider_betslip_id,
      activeBetId: activeBet._id.toString(),
      gameIdentifiers: { identifier: activeBet.gameIdentifier },
      refundType,
    }

    // Credit user and create refund transaction record.
    const refundResult = await creditBalance({
      user,
      amount: request.amount,
      meta: transMeta,
      transactionType: 'refund',
      balanceTypeOverride: activeBet.selectedBalanceType ?? null,
    })

    if (!refundResult.transactionId) {
      throw new SlotegratorError('Failed to credit user for refund.')
    }

    // Update action document.
    await updateAction(action._id, {
      transactionId: refundResult.transactionId,
    })
  },

  resolveResponse: async ({ action, user, activeBet }) => ({
    balance: await getBalanceFromUser({ user, activeBet }),
    transaction_id: action.transactionId ?? action._id.toString(),
  }),
}
