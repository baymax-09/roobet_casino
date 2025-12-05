import { placeThirdPartyBet } from 'src/modules/bet'
import { getGame } from 'src/modules/tp-games/documents/games'

import { type BetSlip } from '../types'
import { type SlotegratorEvent } from '../actions'
import { updateAction } from '../../documents/slotegratorActions'
import { SlotegratorError, getBalanceFromUser } from '../../../common'
import { updateBonusByExternalId } from '../../documents/slotegratorBonuses'

export interface BetRequest {
  action: 'bet'
  amount: number
  betslip: BetSlip
  betslip_id: string
  currency: string
  player_id: string
  session_id: string
  sportsbook_uuid: string
  transaction_id: string
}

export interface BetResponse {
  balance: number
  transaction_id: string
}

/**
 * Creates a ActiveBet record and returns the bet id and player balance.
 */
export const BET_EVENT: SlotegratorEvent<BetRequest, BetResponse> = {
  resolveAction: request => ({
    action: request.action,
    betslipId: request.betslip_id,
    externalTransactionId: request.transaction_id,
    userId: request.player_id,
  }),

  process: async ({ request, action, user }) => {
    const providerBetId = request.betslip.provider_betslip_id
    const tpGame = await getGame({ gid: request.sportsbook_uuid })

    if (!tpGame) {
      throw new SlotegratorError('Cannot place bet on non-existant game.')
    }

    const bonus = request.betslip.parameters.bonus_id
      ? await updateBonusByExternalId(request.betslip.parameters.bonus_id, {
          activated: true,
        })
      : undefined

    // Amount must be manually set to 0 for freebets.
    const betAmount = bonus?.type === 'freebet' ? 0 : request.amount

    // Create an ActiveBet record and take balance from user.
    const betResult = await placeThirdPartyBet({
      user,
      betAmount,
      gameIdentifier: tpGame.identifier,
      externalIdentifier: request.betslip_id,
      meta: {
        providerBetId,
        betId: 'Slotegrator-' + providerBetId,
        betslip: request.betslip,
        bonusType: bonus?.type ?? null,
        bonusAmount: bonus ? request.amount : null,
      },
    })

    if (!betResult.success) {
      throw new SlotegratorError(
        betResult.message,
        betResult.status === 'insufficient_balance'
          ? 'INSUFFICIENT_FUNDS'
          : 'INTERNAL_ERROR',
      )
    }

    // If using bonus, mark it as activated.
    if (request.betslip.parameters.bonus_id) {
      await updateBonusByExternalId(request.betslip.parameters.bonus_id, {
        activated: true,
      })
    }

    // Update action document.
    await updateAction(action._id, {
      transactionId: betResult.activeBet._id.toString(),
    })
  },

  resolveResponse: async ({ action, user, activeBet }) => ({
    balance: await getBalanceFromUser({ user, activeBet }),
    transaction_id: action.transactionId ?? action._id.toString(),
  }),
}
