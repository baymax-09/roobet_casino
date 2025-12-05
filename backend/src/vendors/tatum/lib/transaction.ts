import { Network, TatumSDK } from '@tatumio/tatum'
import { UtxoWalletProvider } from '@tatumio/utxo-wallet-provider'

import { config } from 'src/system/config'
import { scopedLogger } from 'src/system/logger'

import { tatumRestApi } from './api'
import {
  NetworkMap,
  type UTXOTatumSDKType,
  type ValidTatumNetwork,
} from '../types/network'
import {
  GetTransactionResponseV,
  UnspentOutputArrayV,
} from '../types/transaction'

interface TransactionPayload {
  fromAddress: Array<{ address: string }>
  /** value is always denominated in the native token */
  to: Array<{ address: string; value: number }>
  /** stringified version of the fee we are willing to pay, denominated in the native token */
  fee: string
  /** address to send any leftover change */
  changeAddress: string
}

type UTXONetwork = Network.BITCOIN | Network.DOGECOIN | Network.LITECOIN

const { apiKey, loggerId } = config.tatum.keys
const tatumSubscriptions = scopedLogger(loggerId)
const logger = tatumSubscriptions('transactions', { userId: null })

export async function getTransactionById(
  network: ValidTatumNetwork,
  transactionHash: string,
) {
  try {
    return await tatumRestApi(
      '/transaction',
      network,
      transactionHash,
      GetTransactionResponseV,
    )
  } catch (error) {
    logger.error(
      'Failed to get transaction info',
      { network, transactionHash },
      error,
    )
    throw error
  }
}

export async function sendTransaction(
  network: UTXONetwork,
  transactionPayload: TransactionPayload,
) {
  const provider = await TatumSDK.init<UTXOTatumSDKType>({
    apiKey,
    network,
  })
  const PrivateKeyMap: Record<
    Extract<Network, Network.BITCOIN | Network.DOGECOIN | Network.LITECOIN>,
    string
  > = {
    [Network.BITCOIN]: config.bitcoin.privateKey,
    [Network.DOGECOIN]: config.dogecoin.privateKey,
    [Network.LITECOIN]: config.litecoin.privateKey,
  }
  const fromAddressesWithPrivateKey = transactionPayload.fromAddress.map(
    from => ({
      address: from.address,
      privateKey: PrivateKeyMap[network],
    }),
  )
  try {
    return await provider.walletProvider
      .use(UtxoWalletProvider)
      .signAndBroadcast({
        ...transactionPayload,
        fromAddress: fromAddressesWithPrivateKey,
      })
  } catch (error) {
    logger.error('Failed to send transaction', { network }, error)
    throw error
  } finally {
    provider.destroy()
  }
}

export async function getUTXOsForAddress(
  network: ValidTatumNetwork,
  address: string,
  totalValue: number,
) {
  const tatumNetwork = NetworkMap[network]
  const queryParam = `chain=${tatumNetwork}&address=${address}&totalValue=${totalValue}`
  try {
    return await tatumRestApi(
      '/data/utxos',
      network,
      queryParam,
      UnspentOutputArrayV,
    )
  } catch (error) {
    logger.error(
      'Failed to get unspent outputs for address',
      { network, address, totalValue },
      error,
    )
    throw error
  }
}
