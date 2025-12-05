import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'

import {
  SlotegratorError,
  getBalanceFromUser,
  serializeRequestCurrency,
} from '../../../common'
import { type SlotegratorSlotsEvent } from '../actions'
import { getAction } from '../../documents/slotegratorSlotsActions'
import { scopedLogger } from 'src/system/logger'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { creditBalance, deductFromBalance } from 'src/modules/user/balance'

type RollbackAction = 'bet' | 'win'

export interface RollbackRequest {
  action: 'rollback'
  currency: string
  game_uuid: string
  player_id: string
  transaction_id: string
  rollback_transactions: Array<{
    action: RollbackAction
    amount: number
    transaction_id: string
    type: RollbackAction
  }>
  amount: number
  type: 'bet' | 'win'
  session_id: string
  provider_round_id: string
  round_id: string
}

export interface RollbackResponse {
  balance: number
  transaction_id: string
}

const slotegratorSlotsRollbackLogger = scopedLogger('slotegratorSlots-rollback')

export const ROLLBACK_EVENT: SlotegratorSlotsEvent<
  RollbackRequest,
  RollbackResponse
> = {
  resolveAction: async request => {
    const roundId = await (async () => {
      if (request.round_id) {
        return request.round_id
      }

      // Find roundId by looping through rollback transaction records.
      for (const transaction of request.rollback_transactions) {
        // Lookup action document by external ID.
        const actionDocument = await getAction({
          externalTransactionId: transaction.transaction_id,
        })

        if (actionDocument) {
          return actionDocument.roundId
        }
      }

      // Rollback requests should never be rejected because in theory the above
      // information is always available. If these requests are rejected in
      // a production environment, start here when debugging.
      return undefined
    })()

    return {
      action: request.action,
      amount: 0,
      roundId,
      gameId: request.game_uuid,
      userId: request.player_id,
      sessionId: request.session_id,
      externalTransactionId: request.transaction_id,
    }
  },

  process: async (request, _, user, activeBet) => {
    const logger = slotegratorSlotsRollbackLogger('processRollback', {
      userId: request.player_id,
    })

    const rollbackCurrency = serializeRequestCurrency(request.currency)
    if (!rollbackCurrency) {
      throw new SlotegratorError('Invalid currency.')
    }

    // Process each transaction separately.
    for (const transaction of request.rollback_transactions) {
      // Lookup action document by action type and ID.
      const actionDocument = await getAction({
        externalTransactionId: transaction.transaction_id,
      })

      // If the action hasn't been processed, skip.
      if (!actionDocument) {
        continue
      }

      // If the amount is zero or less, skip.
      if (transaction.amount <= 0) {
        continue
      }

      const amountUSD = await currencyExchange(
        transaction.amount,
        rollbackCurrency,
      )
      const conversionInfo = `${transaction.amount} ${request.currency} converted to ${amountUSD} USD`

      if (actionDocument.action === 'win') {
        const takeBalanceMeta: TransactionMeta['winRollback'] = {
          provider: 'slotegrator',
          transactionId: request.transaction_id,
          providerBetId: actionDocument.transactionId,
          gameIdentifiers: { identifier: activeBet.gameIdentifier },
        }

        const deductResult = await deductFromBalance({
          user,
          amount: amountUSD,
          transactionType: 'winRollback',
          meta: takeBalanceMeta,
          balanceTypeOverride: activeBet.selectedBalanceType ?? null,
          allowNegative: true,
        })

        logger.info('takeBalance response', {
          amount: amountUSD,
          transactionId: deductResult.transactionId,
          conversionInfo,
          transactionMeta: takeBalanceMeta,
        })
      }

      if (actionDocument.action === 'bet') {
        const transMeta: TransactionMeta['refund'] = {
          provider: 'slotegrator',
          transactionId: request.transaction_id,
          providerBetId: actionDocument.transactionId,
          gameIdentifiers: { identifier: activeBet.gameIdentifier },
        }

        const creditResult = await creditBalance({
          user,
          amount: amountUSD,
          meta: transMeta,
          transactionType: 'refund',
          balanceTypeOverride: activeBet.selectedBalanceType ?? null,
        })

        logger.info('creditBalance response', {
          amount: amountUSD,
          transactionId: creditResult.transactionId,
          conversionInfo,
          transactionMeta: transMeta,
        })
      }
    }

    // For rollbacks, we do not store our transaction ID since there are multiple.
    // We could store a list instead, but it's not necessary at the moment.
  },
  resolveResponse: async (request, action, user, activeBet) => {
    const returnCurrency = serializeRequestCurrency(request.currency)!
    return {
      transaction_id: action.transactionId ?? action._id.toString(),
      rollback_transactions: request.rollback_transactions.map(
        ({ transaction_id }) => transaction_id,
      ),
      balance: await getBalanceFromUser({
        user,
        activeBet,
        currency: returnCurrency,
      }),
    }
  },
}
