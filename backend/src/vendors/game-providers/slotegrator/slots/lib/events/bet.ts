import { placeThirdPartyBet } from 'src/modules/bet'
import { getGame } from 'src/modules/tp-games/documents/games'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'

import { type SlotegratorSlotsEvent } from '../actions'
import { updateAction } from '../../documents/slotegratorSlotsActions'
import {
  SlotegratorError,
  serializeRequestCurrency,
  getBalanceFromUser,
} from '../../../common'
import { scopedLogger } from 'src/system/logger'
import { updateSlotegratorFreespinRecord } from '../../documents/slotegratorFreespins'

const slotegratorBetLogger = scopedLogger('slotegratorSlots-bet')

export interface BetRequest {
  action: 'bet'
  amount: number
  currency: string
  game_uuid: string
  player_id: string
  transaction_id: string
  session_id: string
  type: 'bet' | 'tip' | 'freespin'
  freespin_id?: string
  quantity?: number
  round_id: string
  finished?: boolean
}

export interface BetResponse {
  balance: number
  transaction_id: string
}

/**
 * Creates a ActiveBet record and returns the bet id and player balance.
 */
export const BET_EVENT: SlotegratorSlotsEvent<BetRequest, BetResponse> = {
  resolveAction: request => ({
    action: request.action,
    gameId: request.game_uuid,
    roundId: request.round_id,
    userId: request.player_id,
    sessionId: request.session_id,
    externalTransactionId: request.transaction_id,
    amount: request.amount,
  }),

  process: async (request, action, user) => {
    const logger = slotegratorBetLogger('processBet', {
      userId: request.player_id,
    })
    const tpGame = await getGame({ gid: request.game_uuid })

    if (!tpGame) {
      throw new SlotegratorError('Cannot place bet on non-existant game.')
    }
    const betCurrency = serializeRequestCurrency(request.currency)

    if (!betCurrency) {
      throw new SlotegratorError('Invalid currency.')
    }
    const betAmountUSD = await currencyExchange(request.amount, betCurrency)
    const conversionInfo = `${request.amount} ${request.currency} converted to ${betAmountUSD} USD`

    // Create an ActiveBet record and take balance from user.
    const betResult = await placeThirdPartyBet({
      user,
      betAmount: betAmountUSD,
      gameIdentifier: tpGame.identifier,
      externalIdentifier: request.round_id,
      meta: {},
    })

    if (!betResult.success) {
      throw new SlotegratorError(
        betResult.message,
        betResult.status === 'insufficient_balance'
          ? 'INSUFFICIENT_FUNDS'
          : 'INTERNAL_ERROR',
      )
    }
    logger.info('activeBet created', {
      betAmountUSD,
      gameIdentifier: tpGame.identifier,
      externalIdentifier: request.round_id,
      conversionInfo,
    })

    if (request.type === 'freespin') {
      const updatePayload = {
        roundsRemaining: request.quantity!,
      }
      await updateSlotegratorFreespinRecord(request.freespin_id!, updatePayload)
    }

    // Update action document.
    await updateAction(action._id, {
      transactionId: betResult.activeBet._id.toString(),
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
