import { updateBonusByExternalId } from '../../documents/slotegratorBonuses'

import { type SlotegratorEvent } from '../actions'
import { getBalanceFromUser, recordAndCloseoutBet } from '../../../common'
import { type SettlementRequest, type SettlementResponse } from './settle'

export const SETTLE_LOSS_EVENT: SlotegratorEvent<
  SettlementRequest,
  SettlementResponse
> = {
  resolveAction: request => ({
    action: request.action,
    betslipId: request.betslip_id,
    userId: request.player_id,
    amount: 0,
  }),

  process: async ({ user, activeBet }) => {
    // Update bonus record.
    const bonusId = activeBet.meta?.betslip?.parameters?.bonus_id

    if (bonusId) {
      await updateBonusByExternalId(bonusId, { settled: true })
    }

    // Run bet closeout helpers.
    await recordAndCloseoutBet({ amount: 0 }, activeBet, user)
  },

  resolveResponse: async ({ user, activeBet }) => ({
    status: 'settled',
    balance: await getBalanceFromUser({ user, activeBet }),
  }),
}
