import { creditBalance } from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { preventOverMaxPayout } from 'src/modules/bet/util'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'

import {
  updateAction,
  sumTotalPayoutAmount,
} from '../../documents/slotegratorSlotsActions'
import {
  type CloseoutBetRequest,
  SlotegratorError,
  getBalanceFromUser,
  recordAndCloseoutBet,
  serializeRequestCurrency,
} from '../../../common'
import { type SlotegratorSlotsEvent } from '../actions'
import { scopedLogger } from 'src/system/logger'
import {
  isValidSlotegratorSlotsProviderInternal,
  type SlotegratorSlotsProvidersInternal,
} from '../providers'
import { getGame } from 'src/modules/tp-games/documents/games'
import { updateOpenActiveBet } from 'src/modules/bet/documents/activeBetsMongo'

const slotegratorWinLogger = scopedLogger('slotegratorSlots-win')

export interface WinRequest {
  action: 'win'
  amount: number
  currency: string
  game_uuid: string
  player_id: string
  transaction_id: string
  session_id: string
  type: 'win' | 'jackpot' | 'freespin'
  freespin_id?: string
  quantity?: number
  round_id: string
  finished?: '0' | '1'
}

export interface WinResponse {
  balance: number
  transaction_id: string
}

type IsRoundFinished = (request: WinRequest) => boolean

const isRoundFinished: Record<
  SlotegratorSlotsProvidersInternal,
  IsRoundFinished
> = {
  // These providers send multiple wins, and include the `finished` property on requests.
  igrosoft: req => !!req.finished,

  // Every win is the end of a round for these providers.
  eurasiangamingbingo: () => true,
  eurasiangamingslots: () => true,
  'g.games': () => true,
  pgsoft: () => true,
  slotmill: () => true,
}

export const WIN_EVENT: SlotegratorSlotsEvent<WinRequest, WinResponse> = {
  resolveAction: request => ({
    action: request.action,
    amount: request.amount,
    gameId: request.game_uuid,
    roundId: request.round_id,
    userId: request.player_id,
    sessionId: request.session_id,
    externalTransactionId: request.transaction_id,
  }),

  process: async (request, action, user, activeBet) => {
    const logger = slotegratorWinLogger('processWin', {
      userId: request.player_id,
    })

    const tpGame = await getGame({ gid: request.game_uuid })

    if (!tpGame) {
      throw new SlotegratorError('Cannot process win on non-existant game.')
    }

    // We must lookup the provider in order to accurately process round closure.
    const provider = tpGame.providerInternal

    if (!isValidSlotegratorSlotsProviderInternal(provider)) {
      throw new SlotegratorError(
        `Cannot process win for unsupported provider: ${provider}.`,
      )
    }

    if (request.amount < 0) {
      throw new SlotegratorError('Cannot credit user less than zero amount.')
    }

    const winCurrency = serializeRequestCurrency(request.currency)

    if (!winCurrency) {
      throw new SlotegratorError('Invalid currency.')
    }

    // Payout this win individually.
    const payoutAmount = request.amount
    const payoutAmountUSD = await currencyExchange(payoutAmount, winCurrency)
    const payoutConversionInfo = `${payoutAmount} ${request.currency} converted to ${payoutAmountUSD} USD`

    // Credit user and create payout transaction record if amount is > 0.
    const transMeta: TransactionMeta['payout'] = {
      provider: 'slotegrator',
      betId: 'Slotegrator-' + request.round_id,
      transactionId: request.transaction_id,
      externalIdentifier: request.round_id,
      activeBetId: activeBet._id.toString(),
      gameIdentifiers: { identifier: activeBet.gameIdentifier },
    }

    const overMaxPayout = await preventOverMaxPayout(
      user.id,
      payoutAmountUSD,
      `${activeBet.gameIdentifier}`,
    )

    if (!overMaxPayout && payoutAmountUSD > 0) {
      const payoutResult = await creditBalance({
        user,
        amount: payoutAmountUSD,
        meta: transMeta,
        transactionType: 'payout',
        balanceTypeOverride: activeBet.selectedBalanceType ?? null,
      })

      if (!payoutResult.transactionId) {
        throw new SlotegratorError('Failed to credit user for win.')
      }

      logger.info('payoutResult', {
        amount: payoutAmountUSD,
        transactionId: payoutResult.transactionId,
        conversionInfo: payoutConversionInfo,
        transactionMeta: transMeta,
      })

      // Update action document.
      await updateAction(action._id, {
        transactionId: payoutResult.transactionId,
      })
    }

    // Some providers support multiple win events. To account for this, we record
    // separate win events and process the round closure at the end.
    if (!isRoundFinished[provider](request)) {
      return
    }

    // Mark active bet as closed out, and verify another process has not already
    // processed the closure and payout.
    const closedActiveBet = await updateOpenActiveBet(activeBet._id, {
      closedOut: new Date(),
    })

    // If the bet was already closed, do not process.
    if (!closedActiveBet) {
      throw new SlotegratorError('Cannot process win for already closed bet.')
    }

    // This amount is in the localized currency.
    const totalRoundAmount = await sumTotalPayoutAmount(action.roundId)
    const totalRoundAmountUSD = await currencyExchange(
      totalRoundAmount,
      winCurrency,
    )
    const conversionInfo = `${totalRoundAmount} ${request.currency} converted to ${totalRoundAmountUSD} USD`

    const closeoutRequest: CloseoutBetRequest = {
      amount: totalRoundAmountUSD,
      gameName: 'slotegrator-slots',
    }

    // Run bet closeout helpers.
    await recordAndCloseoutBet(closeoutRequest, activeBet, user)

    logger.info('roundClosure', {
      roundId: action.roundId,
      amount: payoutAmountUSD,
      conversionInfo,
    })
  },
  resolveResponse: async (request, action, user, activeBet) => {
    const returnCurrency = serializeRequestCurrency(request.currency)!
    return {
      transaction_id: action.transactionId ?? action._id.toString(),
      balance: await getBalanceFromUser({
        user,
        activeBet,
        currency: returnCurrency,
      }),
    }
  },
}
