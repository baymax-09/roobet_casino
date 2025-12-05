import express from 'express'
import { type BlockioNetwork, type BlockioTransaction } from 'block_io'

import { config } from 'src/system'
import { type RouterApp } from 'src/util/api'
import { api } from 'src/util/api'
import { roleCheck } from 'src/modules/admin/middleware'
import {
  BlockioCryptoSymbolList,
  isBlockioCryptoSymbol,
  type BlockioCryptoSymbol,
} from 'src/modules/crypto/types'
import { isRoleAccessPermitted } from 'src/modules/rbac'

import { useBlockioApi } from '../lib/api'
import webhookRoutes from './webhook'
import { processTransactionForCrypto } from '../lib/transaction'
import { type User } from 'src/modules/user/types/User'
import { blockioLogger } from '../lib/logger'

const blockioCryptosToNetwork: Record<BlockioCryptoSymbol, BlockioNetwork> = {
  btc: 'BTC',
  ltc: 'LTC',
  doge: 'DOGE',
}

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/blockio', router)
  webhookRoutes(router)

  router.get(
    '/admin/depositUpdate',
    api.check,
    ...roleCheck([{ resource: 'deposits', action: 'update' }]),
    api.validatedApiCall(async req => {
      const { transactionId, crypto, forcedReprocess } = req.query
      const user = req.user as User

      const authorized = await isRoleAccessPermitted({
        user,
        requests: [{ resource: 'deposits', action: 'dangerously_update' }],
      })

      if (forcedReprocess && authorized) {
        return { success: false, error: 'Permission Denied' }
      }

      if (typeof transactionId !== 'string') {
        return { success: false, error: 'pass transactionId param' }
      }
      if (!crypto) {
        return { success: false, error: 'pass crypto param' }
      }
      if (!isBlockioCryptoSymbol(crypto)) {
        return {
          success: false,
          error: `crypto must be one of "${BlockioCryptoSymbolList.join(',')}"`,
        }
      }

      // offset by 4 days
      const transactionLimitDays = config.crypto.transactionLimitDays - 4

      const blockIoApi = useBlockioApi(crypto)
      const transaction = await blockIoApi.getTransaction(transactionId)
      const transactionDate = new Date(transaction.time * 1000)
      const daysAgo = new Date(
        Date.now() - transactionLimitDays * 24 * 60 * 60 * 1000,
      )

      if (daysAgo > transactionDate) {
        return { success: false, error: 'transaction is too old' }
      }

      const logger = blockioLogger('/admin/depositUpdate', { userId: user.id })
      for (const output of transaction.outputs) {
        // @ts-expect-error need to see if this is string or number out of the block_io lib
        if (output.value > 0) {
          logger.info('transaction', { transaction })
          const payload: BlockioTransaction = {
            address: output.address,
            balance_change: output.value,
            amount_received: output.value,
            txid: transactionId,
            confirmations: transaction.confirmations,
            amount_sent: '0',
            network: blockioCryptosToNetwork[crypto],
          }
          logger.info('payload', payload)
          await processTransactionForCrypto(crypto, payload, !!forcedReprocess)
        }
      }
      return { success: true }
    }),
  )
}
