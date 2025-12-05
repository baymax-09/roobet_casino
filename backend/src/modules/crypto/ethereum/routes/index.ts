import Web3 from 'web3'
import { type Transaction, type TransactionConfig } from 'web3-core'
import express from 'express'
import HDWalletProvider from '@truffle/hdwallet-provider'

import { config } from 'src/system'
import { api, type RouterApp } from 'src/util/api'
import { logAdminAction, roleCheck } from 'src/modules/admin/middleware'
import { type User } from 'src/modules/user/types/User'
import { isRoleAccessPermitted } from 'src/modules/rbac'
import { APIValidationError } from 'src/util/errors'
import { resetFailedWithdrawal } from 'src/modules/withdraw/documents/withdrawals_mongo'

import { derivePrimaryEthWalletAddress } from '..'
import { getWalletByAddress } from '../documents/ethereum_wallets'
import { getWalletOptions } from '../util'
import { cryptoLogger } from '../../lib/logger'
import {
  type ProcessEthereumTransactionResult,
  processEthereumTransaction,
  processEtherscanTransaction,
} from '../lib/transaction'
import {
  type EtherscanInternalTransaction,
  getInternalTxnsByHash,
} from '../lib/etherscan'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/ethereum', router)

  router.post(
    '/transaction/boost',
    api.check,
    ...roleCheck([{ resource: 'deposits', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async (req, res) => {
      const { transactionHash, gasPrice } = req.body

      // 300 gwei is crazy, exit
      if (gasPrice > 300) {
        res.json({
          success: false,
          error: 'gas price too high - units should be gwei',
        })
        return
      }

      const provider = new Web3.providers.HttpProvider(
        config.ethereum.httpProvider,
      )
      const web3 = new Web3(provider)
      const tx = await web3.eth.getTransaction(transactionHash)

      if (!tx) {
        res.json({ success: false, error: 'transaction not found' })
        return
      }

      const wallet = await getWalletByAddress(tx.from)
      const mainWalletAddress = await derivePrimaryEthWalletAddress()

      const isMainAddress =
        Web3.utils.toChecksumAddress(tx.from) ===
        Web3.utils.toChecksumAddress(mainWalletAddress)
      const isUserAddress =
        wallet &&
        Web3.utils.toChecksumAddress(tx.from) ===
          Web3.utils.toChecksumAddress(wallet.address)

      if (!isMainAddress && !isUserAddress) {
        res.json({
          success: false,
          error: 'wallet address from transaction not found',
        })
        return
      }

      const walletOptions = getWalletOptions({
        wallet: isMainAddress ? 'main' : 'user',
        walletIndex: isUserAddress ? wallet.nonce : undefined,
      })

      const walletProvider = new HDWalletProvider(walletOptions)

      web3.setProvider(walletProvider)

      const newGasPrice = gasPrice * 1e9

      const newTx: TransactionConfig = {
        from: tx.from,
        to: tx.to!,
        value: tx.value,
        gasPrice: newGasPrice, // gasPrice from req body has units gwei, convert to wei
        gas: tx.gas,
        nonce: tx.nonce,
        data: tx.input,
      }

      // this is a pool eth value transfer, so we need to reduce the value by the gas cost
      if (tx.value && Number(tx.value) > 0 && !isMainAddress) {
        const value =
          Number(tx.value) - 21000 * (newGasPrice - parseInt(tx.gasPrice))
        newTx.value = value

        if (newTx.value <= 0) {
          res.json({ success: false, error: 'value too low to send' })
          return
        }
      }

      try {
        const newTransactionHash = await new Promise((resolve, reject) => {
          web3.eth
            .sendTransaction(newTx)
            .once('transactionHash', function (transactionHash) {
              resolve(transactionHash)
            })
            .on('error', async function (error) {
              reject(error)
            })
        })

        res.json({
          success: true,
          transactionHash: newTransactionHash,
          error: null,
        })
      } catch (error) {
        cryptoLogger('ethereum/validatedApiCall', {
          userId: wallet?.userId ?? null,
        }).error(
          `Failed to boost transaction for txHash: ${transactionHash} - ${error.message}`,
          { wallet, transactionHash, transaction: newTx },
          error,
        )
        res.json({
          success: false,
          transactionHash: null,
          error: error.message,
        })
      } finally {
        walletProvider.engine.stop()
        provider.disconnect()
      }
    }),
  )

  router.post(
    '/transaction/process',
    api.check,
    ...roleCheck([{ resource: 'deposits', action: 'update' }]),
    logAdminAction,

    api.validatedApiCall(async (req, res) => {
      const { id, smartContract, forcedReprocess } = req.body
      const user = req.user as User
      const authorized = await isRoleAccessPermitted({
        user,
        requests: [{ resource: 'deposits', action: 'dangerously_update' }],
      })

      if (forcedReprocess && !authorized) {
        throw new APIValidationError('Permission denied.')
      }
      // Fetch web3 provider.
      const provider = new Web3.providers.HttpProvider(
        config.ethereum.httpProvider,
        { timeout: 30e3 },
      )
      const web3 = new Web3(provider)

      // regex to check that the transaction hash is a valid length with valid characters
      const isValidHash = /^0x([A-Fa-f0-9]{64})$/.test(id)
      if (!isValidHash) {
        throw new APIValidationError('Invalid Address')
      }

      const latestBlockNumber = await web3.eth.getBlockNumber()

      // Fetch transaction or internal transaction.
      const transactions = await (async (): Promise<
        Transaction[] | EtherscanInternalTransaction[]
      > => {
        if (smartContract) {
          return await getInternalTxnsByHash(id)
        }

        // Check if a receipt exists, this ensure the transaction is safe to process.
        const receipt = await web3.eth.getTransactionReceipt(id)

        if (!receipt) {
          // If the receipt is undefined, then the transaction has not been added to a block yet.
          throw new APIValidationError(
            'Cannot find transaction receipt for specified hash.',
          )
        }

        const tx = await web3.eth.getTransaction(id)

        return [tx]
      })()

      // This should always exist, but let's just make sure.
      if (!transactions.length) {
        const message = `Cannot find transaction record for specified hash. If the hash is known to be valid, available data may be out of date. Please wait and try again later.`
        throw new APIValidationError(message)
      }
      provider.disconnect()

      // Because we can re-process smart contracts, it is possible we will have many
      // internal transactions.
      const results: ProcessEthereumTransactionResult[] = []

      for (const tx of transactions) {
        if ('internal' in tx) {
          const result = await processEtherscanTransaction(
            tx,
            latestBlockNumber,
            forcedReprocess,
          )
          // If there is no result, no deposit address was found.
          if (!result) {
            continue
          }

          results.push(...result)
        } else {
          const result = await processEthereumTransaction(
            tx,
            latestBlockNumber,
            forcedReprocess,
          )
          // If there is no result, no deposit address was found.
          if (!result) {
            continue
          }

          results.push(...result)
        }
      }

      // Close provider connection.
      provider.disconnect()

      res.json(results)
    }),
  )

  router.post(
    '/transaction/reset',
    api.check,
    ...roleCheck([{ resource: 'withdrawals', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async (req, res) => {
      const { transactionId } = req.body
      const withdrawal = await resetFailedWithdrawal(transactionId)

      if (!withdrawal) {
        throw new APIValidationError(
          'Invalid hash. Please provide a valid failed withdrawal hash.',
        )
      }

      return res.json({ success: true })
    }),
  )
}
