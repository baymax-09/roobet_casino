import {
  type Types as UserTypes,
  getUserById,
  userIsLocked,
} from 'src/modules/user'
import {
  getBalanceFromUserAndType,
  creditBalance,
} from 'src/modules/user/balance'
import { scopedLogger } from 'src/system/logger'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { preventOverMaxPayout } from 'src/modules/bet/util'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'

import { SeamlessWalletStatusCodes } from '../enums'
import { updateGameRound } from '../../documents/game-rounds'
import {
  displayCurrencyToCurrencyCode,
  displayCurrencyFromRequestCurrency,
} from '../currencies'
import { convertBalance } from '../utils'
import { makeSuccessResponse, makeErrorResponse } from '../api'
import { type ProcessResult } from '../types'

interface ResultRequest {
  gameId: string
  roundId: string
  providerId: string
  timestamp: unknown
  bonusCode: string
  platform: string
  promoWinAmount: string
  promoWinReference: unknown
  promoCampaignId: string
  promoCampaignType: string
  amount: string
}

export interface ResultRespFields {
  currency: string
  cash: number
  bonus: number
}

type ResultResponse = ProcessResult<ResultRespFields>

const pragmaticLogger = scopedLogger('pragmatic')

/**
 * Using this method the Pragmatic Playsystem will send to Casino Operator the winning result of a bet. The Casino
 * Operator will change the balance of the player in accordance with this request and return the updated balance.
 * Result request may contain a prize that the player is awarded with during the game round, if there is an active
 * promotional campaigns like Prize Drop. Parameters related to the Prize Dropprizes are optional and should be
 * configured by PragmaticPlay team based on Operator’s request
 */
export async function processResult(
  user: UserTypes.User,
  request: ResultRequest,
  userCurrency: DisplayCurrency,
): Promise<ResultResponse> {
  if (await userIsLocked(user)) {
    return makeErrorResponse(
      'User is disabled',
      SeamlessWalletStatusCodes.PLAYER_FROZEN,
    )
  }
  const {
    gameId,
    roundId,
    amount: reqAmount,
    promoWinAmount: reqPromoWinAmount,
  } = request

  const amount = parseFloat(reqAmount) || 0
  const promoWinAmount = parseFloat(reqPromoWinAmount) || 0
  const payAmount = Math.abs(amount + promoWinAmount)

  if (amount < 0) {
    return makeErrorResponse(
      'Invalid payout',
      SeamlessWalletStatusCodes.BAD_PARAMS,
    )
  }

  let gameSession = await updateGameRound(
    { gameSessionId: roundId },
    {
      $inc: { payAmount },
      gameId,
      userId: user.id,
    },
  )

  const sessionCurrency = gameSession?.currency ?? userCurrency

  const winCurrency = displayCurrencyFromRequestCurrency(sessionCurrency)

  if (!winCurrency) {
    return makeErrorResponse(
      'Invalid currency',
      SeamlessWalletStatusCodes.BAD_PARAMS,
    )
  }
  // if this is a new game session store the balance type / field
  if (!gameSession.balanceType) {
    gameSession = await updateGameRound(
      { gameSessionId: roundId },
      { balanceType: user.selectedBalanceType, currency: winCurrency },
    )
  }

  const transMeta: TransactionMeta['payout' | 'prizeDrop'] = {
    provider: 'pragmatic',
    gameSessionId: gameSession.gameSessionId,
    betId: 'PRAG-' + roundId,
    gameIdentifiers: { aggregator: 'pragmatic', gid: request.gameId },
  }
  const [winAmountUSD, promoWinAmountUSD] = await Promise.all([
    currencyExchange(amount, winCurrency),
    currencyExchange(promoWinAmount, winCurrency),
  ])
  pragmaticLogger('processResult', { userId: user.id }).debug(
    'conversion info',
    { transMeta, amount, winCurrency, winAmountUSD },
  )

  const creditPayload = {
    user,
    meta: transMeta,
    balanceTypeOverride: gameSession.balanceType,
  }
  if (winAmountUSD > 0) {
    const overMaxPayout = await preventOverMaxPayout(
      user.id,
      winAmountUSD,
      `pragmatic:${gameId}`,
    )
    if (!overMaxPayout) {
      await creditBalance({
        ...creditPayload,
        amount: winAmountUSD,
        transactionType: 'payout',
      })
    }
  }
  if (promoWinAmountUSD > 0) {
    await creditBalance({
      ...creditPayload,
      amount: promoWinAmountUSD,
      transactionType: 'prizeDrop',
    })
  }

  const newUser = await getUserById(user.id)
  if (!newUser) {
    return makeErrorResponse(
      'User not found',
      SeamlessWalletStatusCodes.PLAYER_NOT_FOUND,
    )
  }
  const balanceReturn = await getBalanceFromUserAndType({
    user: newUser,
    balanceType: gameSession.balanceType,
  })

  const displayBalance = await currencyExchange(
    balanceReturn.balance,
    winCurrency,
    true,
  )

  return makeSuccessResponse({
    currency: displayCurrencyToCurrencyCode(winCurrency),
    cash: convertBalance(displayBalance),
    bonus: 0,
  })
}
