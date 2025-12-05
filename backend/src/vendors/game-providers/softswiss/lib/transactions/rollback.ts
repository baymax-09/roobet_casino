import { type Types as UserTypes, getUserById } from 'src/modules/user'
import { creditBalance, deductFromBalance } from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'

import {
  getActionByActionId,
  touchAction,
  updateAction,
} from '../../documents/actions'
import { getUserBalance } from '../util'
import { getDisplayCurrencyFromRequest, parseSoftswissId } from '../currencies'
import { getErrorStatusCode } from '../error'
import { type SoftswissResponse, type Transaction } from './play'
import { softswissLogger } from '../logger'

interface Action {
  action: 'rollback'
  action_id: string
  original_action_id: string
}

interface RollbackRequest {
  user_id: string
  currency: string
  game: string
  game_id: string
  finished: boolean
  actions: Action[]
}

interface RollbackResponse {
  game_id: string
  balance: number
  transactions: Transaction[]
}

/**
 * @todo break apart this file: separate the responsibilities of looping through the actions to rollback from rolling back an action.
 * i.e. transport layer distinct from application layer
 */
export async function rollback(
  request: RollbackRequest,
): Promise<SoftswissResponse<RollbackResponse>> {
  const userId = parseSoftswissId(request.user_id)
  if (!userId) {
    const statusCode = getErrorStatusCode('player deleted')
    return {
      body: { balance: 0, game_id: request.game_id, transactions: [] },
      ...statusCode,
    }
  }

  const logger = softswissLogger('rollback', { userId })

  const rollbackCurrency = getDisplayCurrencyFromRequest(request)
  if (!rollbackCurrency) {
    const statusCode = getErrorStatusCode('invalid currency')
    logger.error('error [currency]', { statusCode })
    return {
      body: { balance: 0, game_id: request.game_id, transactions: [] },
      ...statusCode,
    }
  }
  try {
    const processedActions = await processRollbackActions(
      request,
      userId,
      rollbackCurrency,
    )
    const userBalance = await getUserBalance(
      { user_id: userId },
      rollbackCurrency,
    )

    return {
      body: {
        balance: userBalance,
        transactions: processedActions?.transactions,
        game_id: request.game_id,
      },
      status: 200,
      code: 0,
    }
  } catch (error) {
    logger.error('error', { request }, error)
    const statusCode = getErrorStatusCode(error)
    const userBalance = await getUserBalance(
      { user_id: userId },
      rollbackCurrency,
    )

    return {
      body: {
        balance: userBalance,
        game_id: request.game_id,
        transactions: [],
      },
      ...statusCode,
    }
  }
}

async function processRollbackActions(
  request: RollbackRequest,
  userId: string,
  rollbackCurrency: DisplayCurrency,
): Promise<{ transactions: Transaction[] }> {
  const transactions: Transaction[] = []
  const user = await getUserById(userId)
  if (!user) {
    throw 'player deleted'
  }

  if (request.actions) {
    for (const action of request.actions) {
      const { action: internalAction, existed } = await touchAction(
        action.action_id,
        {
          game: request.game,
          game_id: request.game_id,
          amount: 0,
          userId,
          action: 'rollback',
        },
      )

      if (!internalAction) {
        // undefined behavior
        continue
      }

      if (!existed) {
        await processRollbackAction(request, action, user, rollbackCurrency)
      }

      transactions.push({
        action_id: action.action_id,
        tx_id: internalAction._id.toString(),
      })
    }
  }
  return { transactions }
}

async function processRollbackAction(
  request: RollbackRequest,
  action: Action,
  user: UserTypes.User,
  rollbackCurrency: DisplayCurrency,
): Promise<void> {
  const logger = softswissLogger('processRollbackAction', { userId: user.id })
  const originalAction = await getActionByActionId(action.original_action_id)

  // TODO extract per action rollback logic into functions: none/bet/win
  if (!originalAction) {
    /*
     * Save the original action so it can never be processed this handles the case when you rollback an action that
     * has not been processed yet.
     */
    touchAction(action.original_action_id, {
      action: 'generatedByRollback',
      userId: user.id,
      game: request.game,
      game_id: request.game_id,
      amount: 0,
    })
    // TODO extract per action rollback logic into functions: none/bet/win
  } else if (originalAction.action === 'bet') {
    const transMeta: TransactionMeta['refund'] = {
      provider: 'softswiss',
      // This is the full game identifier.
      gameIdentifiers: { identifier: originalAction.game },
    }

    const betRollbackUSD = await currencyExchange(
      originalAction.amount,
      rollbackCurrency,
    )
    logger.info('conversion info', {
      transMeta,
      amount: originalAction.amount,
      rollbackCurrency,
      betRollbackUSD,
    })

    await creditBalance({
      user,
      transactionType: 'refund',
      amount: betRollbackUSD,
      meta: transMeta,
      // TODO refund in the original balanceType
      balanceTypeOverride: null,
    })
    await updateAction(action.action_id, {
      amount: originalAction.amount,
    })
    // TODO extract per action rollback logic into functions: none/bet/win
  } else if (originalAction.action === 'win') {
    const winRollbackUSD = await currencyExchange(
      originalAction.amount,
      rollbackCurrency,
    )
    try {
      const transMeta: TransactionMeta['winRollback'] = {
        provider: 'softswiss',
        // This is the full game identifier.
        gameIdentifiers: { identifier: originalAction.game },
      }

      logger.debug('conversion info', {
        transMeta,
        rollbackCurrency,
        winRollbackUSD,
        amount: originalAction.amount,
      })

      // TODO should we let a rollback take the user's balance negative?
      // if so make sure to return balance =0 to Softswiss
      await deductFromBalance({
        user,
        amount: winRollbackUSD,
        transactionType: 'winRollback',
        meta: transMeta,
        balanceTypeOverride: null,
      })
      await updateAction(action.action_id, {
        amount: originalAction.amount,
      })
    } catch (error) {
      // Softswiss explicitly expects us to not fail a rollback due to insufficient funds
      if (error.message !== 'bet__not_enough_balance') {
        throw error
      }
    }
  }
}
