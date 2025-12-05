import { creditBalance } from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'

import { updateAction } from '../../documents/slotegratorActions'
import {
  SlotegratorError,
  getBalanceFromUser,
  recordAndCloseoutBet,
} from '../../../common'
import { type SlotegratorEvent } from '../actions'
import { type BetSlip } from '../types'
import { preventOverMaxPayout } from 'src/modules/bet/util'

export interface WinRequest {
  action: 'win'
  amount: number
  betslip: BetSlip
  betslip_id: string
  currency: string
  player_id: string
  session_id: string
  sportsbook_uuid: string
  transaction_id: string
}

export interface WinResponse {
  balance: number
  transaction_id: string
}

export const WIN_EVENT: SlotegratorEvent<WinRequest, WinResponse> = {
  resolveAction: request => ({
    action: request.action,
    betslipId: request.betslip_id,
    transactionId: request.transaction_id,
    userId: request.player_id,
    amount: request.amount,
  }),

  process: async ({ request, action, user, activeBet }) => {
    const providerBetId = request.betslip.provider_betslip_id

    if (request.amount < 0) {
      throw new SlotegratorError('Cannot credit user less than zero amount.')
    }

    // Run bet closeout helpers.
    await recordAndCloseoutBet(request, activeBet, user)

    if (request.amount === 0) {
      // Bet was lost, early return, run hooks but do not credit user or create transition.
      return
    }

    // Credit user and create payout transaction record if amount is > 0.
    const transMeta: TransactionMeta['payout'] = {
      provider: 'slotegrator',
      providerBetId,
      betId: 'Slotegrator-' + providerBetId,
      transactionId: request.transaction_id,
      externalIdentifier: request.betslip_id,
      activeBetId: activeBet._id.toString(),
      gameIdentifiers: { identifier: activeBet.gameIdentifier },
    }

    const overMaxPayout = await preventOverMaxPayout(
      user.id,
      request.amount,
      `${activeBet.gameIdentifier?.toString()}`,
    )

    if (overMaxPayout) {
      throw new SlotegratorError('Over max payout, rejecting win.')
    }

    const payoutResult = await creditBalance({
      user,
      amount: request.amount,
      meta: transMeta,
      transactionType: 'payout',
      balanceTypeOverride: activeBet.selectedBalanceType ?? null,
    })

    if (!payoutResult.transactionId) {
      throw new SlotegratorError('Failed to credit user for win.')
    }

    // Update action document.
    await updateAction(action._id, {
      transactionId: payoutResult.transactionId,
    })
  },
  resolveResponse: async ({ action, user, activeBet }) => ({
    transaction_id: action.transactionId ?? action._id.toString(),
    balance: await getBalanceFromUser({ user, activeBet }),
  }),
}
