import express from 'express'
import { toBN } from 'web3-utils'
import { Client, isValidAddress, type Payment } from 'xrpl'

import { config } from 'src/system'
import { api, type RouterApp } from 'src/util/api'
import { logAdminAction, roleCheck } from 'src/modules/admin/middleware'
import {
  getTransaction,
  derivePrimaryWallet,
  submitTransaction,
} from 'src/modules/crypto/ripple/lib'
import { cryptoLogger } from '../../lib/logger'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/ripple', router)

  router.post(
    '/transaction/boost',
    api.check,
    ...roleCheck([{ resource: 'deposits', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async (req, res) => {
      const { transactionHash, fee } = req.body

      // 10000 drops is crazy, exit
      if (fee > 10000) {
        res.json({
          success: false,
          error: 'fee price is too high - units should be drops',
        })
        return
      }

      const client = new Client(config.ripple.wsProvider)
      await client.connect()
      const tx = await getTransaction(client, transactionHash)

      if (!tx) {
        res.json({ success: false, error: 'transaction not found' })
        return
      }

      const mainWalletAddress = derivePrimaryWallet().classicAddress

      const isMainAddress =
        isValidAddress(mainWalletAddress) &&
        tx.result.Account === mainWalletAddress

      if (!isMainAddress) {
        res.json({
          success: false,
          error: 'wallet address from transaction not found',
        })
        return
      }

      const { Fee: oldFee = '0', Amount: oldAmount } = tx.result as Payment

      const newTxConfig = {
        ...(tx.result as Payment),
        Fee: fee,
      }

      // this is a pool eth value transfer, so we need to reduce the value by the gas cost
      if (oldAmount && toBN(oldAmount.toString()).gt(toBN('0'))) {
        const newAmount = toBN(oldAmount.toString()).sub(
          toBN(fee).sub(toBN(oldFee)),
        )

        if (newAmount.lte(toBN('0'))) {
          res.json({ success: false, error: 'value too low to send' })
          return
        }
        newTxConfig.Amount = newAmount.toString()
      }

      try {
        const newTransactionHash = await submitTransaction(
          client,
          newTxConfig,
          { wallet: derivePrimaryWallet() },
        )

        res.json({
          success: true,
          transactionHash: newTransactionHash,
          error: null,
        })
      } catch (error) {
        cryptoLogger('ripple/transaction/boost', {
          userId: req.user?.id ?? null,
        }).error(
          `Failed to boost transaction for txHash: ${transactionHash} - ${error.message}`,
          error,
        )
        res.json({
          success: false,
          transactionHash: null,
          error: error.message,
        })
      } finally {
        await client.disconnect()
      }
    }),
  )
}
