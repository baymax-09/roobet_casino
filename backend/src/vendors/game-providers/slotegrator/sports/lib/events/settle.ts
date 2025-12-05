import { updateBonusByExternalId } from '../../documents/slotegratorBonuses'
import { type SlotegratorEvent } from '../actions'
import { getBalanceFromUser } from '../../../common'

export interface SettlementRequest {
  action: 'settle'
  betslip_id: string
  currency: string
  player_id: string
}

export interface SettlementResponse {
  balance: number
  status: 'open' | 'settled'
}

/**
 * Request to close out won bet. No additional events should be processed.
 */
export const SETTLE_EVENT: SlotegratorEvent<
  SettlementRequest,
  SettlementResponse
> = {
  resolveAction: request => ({
    action: request.action,
    betslipId: request.betslip_id,
    userId: request.player_id,
  }),

  process: async ({ activeBet }) => {
    // Update bonus record.
    const bonusId = activeBet.meta?.betslip?.parameters?.bonus_id

    if (bonusId) {
      await updateBonusByExternalId(bonusId, { settled: true })
    }

    // No additional business logic is necessary.
  },
  resolveResponse: async ({ user, activeBet }) => ({
    status: 'settled',
    balance: await getBalanceFromUser({ user, activeBet }),
  }),
}
