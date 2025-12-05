import moment from 'moment'
import BlockIo, {
  type TransactionType,
  type BlockioRawTransaction,
  type GetNetworkFeeEstimateParams,
  type BlockioNotification,
  type PrepareTransactionParams,
} from 'block_io'

import { config } from 'src/system'
import {
  type BlockioCryptoSymbol,
  type BlockioCryptoProperName,
} from 'src/modules/crypto/types'

import { type BlockioNotificationType } from '../types'
import { blockioLogger } from './logger'

export interface BlockioApi {
  getBalanceForAddress: (
    address: string,
    returnPending?: boolean,
  ) => Promise<number>
  getBalance: (returnPending?: boolean) => Promise<number>
  getTransaction: (transactionId: string) => Promise<BlockioRawTransaction>
  getNetworkFeeEstimate: (
    params: GetNetworkFeeEstimateParams,
  ) => Promise<string>
  isValidAddress: (address: string) => Promise<boolean>
  withdraw: (
    params: PrepareTransactionParams,
  ) => Promise<{ network: 'BTC' | 'LTC' | 'DOGE'; txid: string }>
  createNotification: (
    crypto: BlockioCryptoSymbol,
    type: BlockioNotificationType,
  ) => Promise<unknown>
  deleteNotification: (notificationId: string) => Promise<unknown>
  listNotifications: () => Promise<BlockioNotification[]>
  getTransactionsForAddress: (
    address: string,
    type: TransactionType,
  ) => Promise<unknown>
  makeAddressForWallet: (walletId: string) => Promise<string>
}

const blockioConfig = {
  pin: config.blockio.pin,
  options: {},
} as const

const blockIos = {
  btc: new BlockIo({ ...blockioConfig, api_key: config.blockio.bitcoinKey }),
  ltc: new BlockIo({ ...blockioConfig, api_key: config.blockio.litecoinKey }),
  doge: new BlockIo({ ...blockioConfig, api_key: config.blockio.dogecoinKey }),
}

export const useBlockioApi = (currency: BlockioCryptoSymbol): BlockioApi => {
  const blockIo = blockIos[currency]

  const api: BlockioApi = {
    getBalanceForAddress: async (address, returnPending = false) => {
      const response = await blockIo.get_address_balance({ addresses: address })
      if (response.data && response.status === 'success') {
        const { available_balance, pending_received_balance } = response.data
        if (!returnPending) {
          return parseFloat(available_balance)
        } else {
          return parseFloat(pending_received_balance)
        }
      }
      blockioLogger('getBalanceForAddress', { userId: null }).error(
        'blockio bad response.',
        { data: response.data },
      )
      throw 'Invalid response from blockio'
    },

    getBalance: async (returnPending = false) => {
      const data = await blockIo.get_balance()
      const {
        data: { available_balance, pending_received_balance },
      } = data
      if (!returnPending) {
        return parseFloat(available_balance)
      } else {
        return parseFloat(pending_received_balance)
      }
    },

    getTransaction: async transactionId => {
      const response = await blockIo.get_raw_transaction({
        txid: transactionId,
      })
      if (response.data && response.status === 'success') {
        return response.data
      }
      blockioLogger('getTransaction', { userId: null }).error(
        'blockio bad response.',
        { data: response.data },
      )
      throw 'Invalid response from blockio'
    },

    /** this returns a fee denominated in the cryptocurrency -- NOT USD */
    getNetworkFeeEstimate: async params => {
      const logger = blockioLogger('getNetworkFeeEstimate', {
        userId: null,
      }).info('network fee estimate params', params)
      const response = await blockIo.get_network_fee_estimate(params)
      if (response.data && response.data.estimated_network_fee) {
        return response.data.estimated_network_fee
      }
      logger.error('blockio bad response.', { data: response.data })
      throw 'Invalid response from blockio'
    },

    isValidAddress: async (address: string) => {
      const response = await blockIo.is_valid_address({ address })

      if (response.status === 'success') {
        return response.data.is_valid === true
      }
      throw 'invalid blockio response'
    },

    withdraw: async params => {
      // first prepare the transaction
      const preparedTransaction = await blockIo.prepare_transaction(params)

      // then check the transaction before signing and sending
      const summarizedTransaction =
        await blockIo.summarize_prepared_transaction({
          data: preparedTransaction,
        })
      const logger = blockioLogger('withdraw', { userId: null }).info(
        'Summarized BlockIo Transaction - Withdrawal',
        { summarizedTransaction },
      )
      // TODO add checks here to verify that transaction is acceptable BEFORE sending

      // authorize the transaction to be sent
      const signedTransaction = await blockIo.create_and_sign_transaction({
        data: preparedTransaction,
      })

      logger.info('Blockio transaction info', {
        preparedTransaction,
        summarizedTransaction,
        signedTransaction,
      })

      // send the transaction
      const response = await blockIo.submit_transaction({
        transaction_data: signedTransaction,
      })
      logger.info('Submit BlockIo Transaction Response', { response })

      if (response.data && response.status === 'success') {
        return response.data
      }
      logger.error('blockio bad response.', { data: response.data })
      throw 'Invalid response from blockio'
    },

    createNotification: async (crypto, type) => {
      const notificationPayload = {
        type,
        url: `${config.appSettings.webhookBase}/blockio/webhook/${crypto}/s/${config.blockio.apiSecret}`,
      }
      const logger = blockioLogger('createNotification', { userId: null }).info(
        'createNotification',
        { notificationPayload },
      )
      const response = await blockIo.create_notification(notificationPayload)
      logger.info(
        `${crypto} new blocks ${type} notification created. Create notification response ${response}`,
      )
      // @ts-expect-error I believe this should just be response.status, will be checking soon
      return response.data && response.data.status === 'success'
    },

    deleteNotification: async notificationId => {
      const notificationPayload = { notification_id: notificationId }
      const logger = blockioLogger('deleteNotification', { userId: null }).info(
        'delete notification',
        { notificationPayload },
      )
      const response = await blockIo.delete_notification(notificationPayload)
      logger.info('delete notification response', { response })
      // @ts-expect-error I believe this should just be response.status, will be checking soon
      return response.data && response.data.status === 'success'
    },

    listNotifications: async () => {
      const response = await blockIo.get_notifications()
      return response.data
    },

    getTransactionsForAddress: async (address, type) => {
      const response = await blockIo.get_transactions({
        addresses: address,
        type,
      })
      return response.data.txs
    },

    // TODO walletId should be userId instead
    makeAddressForWallet: async walletId => {
      const response = await blockIo.get_new_address({
        label: `${walletId}-${moment().unix()}-${Math.floor(
          Math.random() * 100000,
        )}`,
        address_type: currency === 'btc' ? 'witness_v0' : 'P2SH',
      })
      blockioLogger('makeAddressForWallet', { userId: null }).info(
        'got response',
        {
          response,
        },
      )
      if (response.status === 'success') {
        return response.data.address
      }
      throw 'Error making wallet'
    },
  }

  return api
}

export const bitcoinBlockioApi = useBlockioApi('btc')
export const litecoinBlockioApi = useBlockioApi('ltc')
export const dogecoinBlockioApi = useBlockioApi('doge')

export const BlockIOApiMap: Record<
  Exclude<BlockioCryptoProperName, 'Ethereum'>,
  BlockioApi
> = {
  Bitcoin: bitcoinBlockioApi,
  Litecoin: litecoinBlockioApi,
  Dogecoin: dogecoinBlockioApi,
}
