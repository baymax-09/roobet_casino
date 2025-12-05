import { deductFromBalance } from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { publishUserSportsbookBetToFastTrack } from 'src/vendors/fasttrack'

import { updateAction } from '../../documents/slotegratorActions'
import { SlotegratorError, getBalanceFromUser } from '../../../common'
import { type SlotegratorEvent } from '../actions'

export interface RollbackRequest {
  action: 'rollback'
  amount: number
  bet_transaction_id: string
  betslip_id: string
  currency: string
  parent_transaction_id: string
  player_id: string
  transaction_id: string
}

export interface RollbackResponse {
  balance: number
  transaction_id: string
}

/**
 * Rollback partial or all balance. A rollback is only ever called
 * after a win has been processed.
 */
export const ROLLBACK_EVENT: SlotegratorEvent<
  RollbackRequest,
  RollbackResponse
> = {
  resolveAction: request => ({
    action: request.action,
    betslipId: request.betslip_id,
    externalTransactionId: request.bet_transaction_id,
    userId: request.player_id,
    amount: request.amount,
  }),

  process: async ({ request, action, user, activeBet }) => {
    const takeBalanceMeta: TransactionMeta['winRollback'] = {
      provider: 'slotegrator',
      providerBetId: activeBet.meta?.betslip.provider_betslip_id,
      transactionId: request.bet_transaction_id,
      parentTransactionId: request.parent_transaction_id,
      externalIdentifier: request.betslip_id,
      gameIdentifiers: { identifier: activeBet.gameIdentifier },
    }

    const takeBalance = await deductFromBalance({
      user,
      amount: request.amount,
      transactionType: 'winRollback',
      meta: takeBalanceMeta,
      balanceTypeOverride: activeBet.selectedBalanceType ?? null,
      allowNegative: true,
    })

    if (!takeBalance.transactionId) {
      throw new SlotegratorError('Failed to take balance from user.')
    }

    // Update action document.
    await updateAction(action._id, {
      transactionId: takeBalance.transactionId,
    })

    // Publish message to RabbitMQ that a Slotegrator rollback has taken place
    publishUserSportsbookBetToFastTrack({
      activeBet,
      rollback: true,
    })
  },

  resolveResponse: async ({ action, user, activeBet }) => ({
    balance: await getBalanceFromUser({ user, activeBet }),
    transaction_id: action.transactionId ?? action._id.toString(),
  }),
}
