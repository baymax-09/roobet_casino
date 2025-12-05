import { type Types as UserTypes, getUserById } from 'src/modules/user'
import {
  creditBalance,
  deductFromBalance,
  getBalanceFromUserAndType,
} from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { t } from 'src/util/i18n'
import { getGameCurrency } from 'src/modules/user/lib/gameCurrency'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'

import { updateGameSession } from '../../documents/game-sessions'
import { type Hub88Transaction } from '../../documents/transactions'
import {
  convertBalanceToAmount,
  convertAmountToBalance,
  makeSuccessResponse,
  makeErrorResponse,
  type Hub88TransactionResp,
} from '../utils'
import {
  displayCurrencyToCurrencyCode,
  getDisplayCurrencyFromRequest,
} from '../currencies'
import { StatusCodes } from '../enums'
import { hub88Logger } from '../logger'

export interface RollbackRequest {
  user: string
  transaction_uuid: string
  supplier_transaction_id: string
  token: string
  round_closed: boolean
  round: string
  request_uuid: string
  reference_transaction_uuid: string
  game_code: string
  /** @deprecated being deprecated in favor of gameIdentifier. */
  game_id?: string
}

export async function processRollback(
  user: UserTypes.User,
  request: RollbackRequest,
  originalTransaction: Hub88Transaction | null,
): Promise<Hub88TransactionResp> {
  if (!originalTransaction) {
    const displayCurrency = await getGameCurrency(
      user.id,
      `hub88:${request.game_code}`,
    )

    const balanceReturn = await getBalanceFromUserAndType({
      user,
      balanceType: user.selectedBalanceType,
    })
    const displayBalance = await currencyExchange(
      balanceReturn.balance,
      displayCurrency,
      true,
    )
    return makeSuccessResponse(request, 'rollback', {
      user: user.id,
      balance: convertBalanceToAmount(displayBalance),
      currency: displayCurrencyToCurrencyCode(displayCurrency),
    })
  }
  if (originalTransaction.rolledBack) {
    const previousResponse = JSON.parse(originalTransaction.response)
    const transactionCurrency = getDisplayCurrencyFromRequest(
      previousResponse.request,
    )

    if (!transactionCurrency) {
      return makeErrorResponse(
        t(user, 'unsupported__currency'),
        StatusCodes.RS_ERROR_WRONG_CURRENCY,
      )
    }

    const balanceReturn = await getBalanceFromUserAndType({
      user,
      balanceType: user.selectedBalanceType,
    })
    const displayBalance = await currencyExchange(
      balanceReturn.balance,
      transactionCurrency,
      true,
    )
    return makeSuccessResponse(request, 'rollback', {
      user: user.id,
      balance: convertBalanceToAmount(displayBalance),
      currency: displayCurrencyToCurrencyCode(transactionCurrency),
    })
  }

  const previousResponse = JSON.parse(originalTransaction.response)
  const amount = convertAmountToBalance(previousResponse.request.amount)

  const requestCurrency = getDisplayCurrencyFromRequest(
    previousResponse.request,
  )
  if (!requestCurrency) {
    return makeErrorResponse(
      t(user, 'unsupported__currency'),
      StatusCodes.RS_ERROR_WRONG_CURRENCY,
    )
  }
  const rollbackAmountUSD = await currencyExchange(amount, requestCurrency)

  const { game_id, round_closed, round } = request
  const logger = hub88Logger('processRollback', { userId: user.id })

  let gameSession
  if (originalTransaction.transactionType === 'win') {
    gameSession = await updateGameSession(
      { gameSessionId: round },
      {
        $inc: { payAmount: -Math.abs(amount) },
        gameId: game_id,
        userId: user.id,
        finished: round_closed,
      },
    )

    const transMeta: TransactionMeta['winRollback'] = {
      provider: 'hub88',
      gameSessionId: gameSession.gameSessionId,
      gameIdentifiers: { aggregator: 'hub88', gid: game_id },
    }

    logger.debug('win conversion info', {
      transMeta,
      amount,
      requestCurrency,
      rollbackAmountUSD,
    })

    await deductFromBalance({
      user,
      amount: rollbackAmountUSD,
      transactionType: 'winRollback',
      meta: transMeta,
      balanceTypeOverride: gameSession.balanceType,
      allowNegative: true,
    })
  } else if (originalTransaction.transactionType === 'bet') {
    gameSession = await updateGameSession(
      { gameSessionId: round },
      {
        $inc: { payAmount: Math.abs(amount) },
        gameId: game_id,
        userId: user.id,
        finished: round_closed,
      },
    )
    const transMeta = {
      provider: 'hub88',
      gameSessionId: gameSession.gameSessionId,
      gameIdentifiers: { aggregator: 'hub88', gid: game_id },
    }

    logger.debug('bet conversion info', {
      transMeta,
      amount,
      requestCurrency,
      rollbackAmountUSD,
    })

    await creditBalance({
      user,
      amount: rollbackAmountUSD,
      meta: transMeta,
      transactionType: 'refund',
      balanceTypeOverride: gameSession.balanceType,
    })
  }

  const newUser = await getUserById(user.id)
  // TODO: what is supposed to happen if there is no user found?
  const balanceReturn = await getBalanceFromUserAndType({
    user: newUser!,
    balanceType: gameSession?.balanceType || user.selectedBalanceType,
  })

  const displayBalance = await currencyExchange(
    balanceReturn.balance,
    requestCurrency,
    true,
  )
  const response = makeSuccessResponse(request, 'rollback', {
    user: user.id,
    balance: convertBalanceToAmount(displayBalance),
    currency: displayCurrencyToCurrencyCode(requestCurrency),
  })

  return response
}
