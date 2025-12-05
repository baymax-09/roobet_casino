import { type Types as UserTypes } from 'src/modules/user'
import { creditBalance } from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'

import { SeamlessWalletStatusCodes } from '../enums'
import { updateGameRound } from '../../documents/game-rounds'
import { makeSuccessResponse, makeErrorResponse } from '../api'
import { touchTransaction } from '../../documents/transactions'
import { getIdentifierForGameId } from '../games'
import {
  displayCurrencyFromRequestCurrency,
  parseCurrencyFromPragId,
} from '../currencies'
import { type ProcessResult } from '../types'
import { pragmaticLogger } from '../logger'

interface RefundRequest {
  hash: string
  userId: string
  reference: string
  providerId: string
}

export type RefundRespFields = Record<never, never>

type RefundResponse = ProcessResult<RefundRespFields>

/**
 * This function needs to run regardless if user is locked or not
 */
export async function processRefund(
  user: UserTypes.User,
  request: RefundRequest,
): Promise<RefundResponse> {
  // Create the transaction for the bet so we don't process it.
  const { transaction: betTransaction, existed: betTransactionExisted } =
    await touchTransaction(
      user.id,
      request.reference,
      // We don't receive this information on the refund request.
      {
        userId: user.id,
        gameId: '',
        providerId: '',
        roundId: '',
        reference: request.reference,
      },
      'bet',
      makeSuccessResponse({
        usedPromo: 0,
        bonus: 0,
        // TODO add currency, cash
      }),
    )

  if (!betTransaction) {
    return makeErrorResponse(
      'Internal Error',
      SeamlessWalletStatusCodes.INTERNAL_SERVER_ERROR_NO_RECONCILE,
    )
  }

  // If the bet was not processed or wasn't successful, then don't process.
  if (!betTransactionExisted || betTransaction.response?.error !== 0) {
    const response = makeSuccessResponse({})
    return response
  }

  const { roundId, amount, gameId } = betTransaction.payload

  if (amount < 0) {
    return makeErrorResponse(
      'Invalid payout',
      SeamlessWalletStatusCodes.BAD_PARAMS,
    )
  }

  const payAmount = Math.abs(amount)

  const gameSession = await updateGameRound(
    { gameSessionId: roundId },
    {
      $inc: { payAmount: -Math.abs(payAmount) },
      gameId,
      userId: user.id,
      finished: true,
    },
  )

  if (!gameSession) {
    // No game session to cancel
    return makeErrorResponse(
      'No game session',
      SeamlessWalletStatusCodes.GAME_NOT_FOUND,
    )
  }

  const userCurrency = parseCurrencyFromPragId(betTransaction.userId)
  const sessionCurrency =
    gameSession?.currency ?? displayCurrencyFromRequestCurrency(userCurrency)

  if (!sessionCurrency) {
    return makeErrorResponse(
      'No session currency found',
      SeamlessWalletStatusCodes.BAD_PARAMS,
    )
  }

  const transMeta: TransactionMeta['refund'] = {
    provider: 'pragmatic',
    gameSessionId: gameSession.gameSessionId,
    reference: request?.reference,
    gameIdentifiers: { identifier: getIdentifierForGameId(gameId) },
  }

  const payAmountUSD = await currencyExchange(payAmount, sessionCurrency)
  pragmaticLogger('processRefund', { userId: user.id }).debug(
    'conversion info',
    { transMeta, amount, sessionCurrency, payAmountUSD },
  )

  await creditBalance({
    user,
    amount: payAmountUSD,
    transactionType: 'refund',
    meta: transMeta,
    balanceTypeOverride: gameSession.balanceType,
  })

  return makeSuccessResponse({})
}
