import { type AbiItem } from 'web3-utils'
import axios from 'axios'

import { config } from 'src/system'
import { cryptoLogger } from '../../lib/logger'

export interface EtherscanInternalTransactionResult {
  blockNumber: string
  timeStamp: string
  hash: string
  from: string
  to: string
  value: string
  contractAddress: string
  input: string
  type: string
  gas: string
  gasUsed: string
  /** 0 means successful and 1 means error - stringified truthy and falsey values */
  isError: '0' | '1'
  errCode: string
}

export type EtherscanInternalTransaction =
  EtherscanInternalTransactionResult & { internal: true }

export interface EtherscanGasPriceResult {
  SafeGasPrice: string
  ProposeGasPrice: string
  FastGasPrice: string
}

type EtherscanGasOracelResult = EtherscanGasPriceResult & {
  LastBlock: string
  suggestBaseFee: string
  gasUsedRatio: string
}

interface EtherscanGasOracleResponse {
  data: {
    status: string
    message: string
    result: EtherscanGasOracelResult
  }
}

interface EtherscanTxListInternalResponse {
  data: {
    status: string
    message: string
    result: EtherscanInternalTransactionResult[]
  }
}

const baseUrl = `https://${
  config.isProd ? 'api' : 'api-goerli'
}.etherscan.io/api`
const feeUrl = 'https://api.etherscan.io/api'
const baseContractUrl = config.etherscan.url
const defaultParams = {
  apikey: config.etherscan.apiKey,
}

/**
 * Sum the total value sent to like destination wallets for any given
 * list of etherscan internal transactions.
 *
 * Example:
 *
 * wallet1 => wallet2 10 ETH
 * wallet1 => wallet2 10 ETH
 *
 * is reduced to
 *
 * wallet1 => wallet2 20 ETH
 *
 */
const reduceInternalTransactions = (
  txs: EtherscanInternalTransactionResult[],
): EtherscanInternalTransaction[] => {
  return txs
    .filter(tx => tx.isError === '0')
    .reduce((acc, curr) => {
      // Find the index of any bundled transactions by matching hash and to properties.
      const index = acc.findIndex(
        item => item.to === curr.to && item.hash === curr.hash,
      )

      // If we find a match then sum the value to the existing internal transaction.
      if (index !== -1) {
        const left = Number(acc[index].value)
        const right = Number(curr.value)

        acc[index].value = `${left + right}`
      } else {
        acc.push({ ...curr, internal: true })
      }
      return acc
    }, [] as EtherscanInternalTransaction[])
}

export async function getContractABI(
  contractAddress: string,
): Promise<AbiItem[] | null> {
  const logger = cryptoLogger('ethereum/getContractABI', { userId: null })
  if (!config.etherscan.enabled) {
    logger.error(
      'etherscan manually disabled, returning null from getContractABI',
      { etherscan: config.etherscan },
    )
    return null
  }

  const params = {
    ...defaultParams,
    module: 'contract',
    action: 'getabi',
    address: contractAddress,
  }

  const response = await axios.get(baseContractUrl, { params })

  if (response.data && response.data.result) {
    try {
      return JSON.parse(response.data.result)
    } catch (error) {
      logger.error(`etherscan api down - ${error.message}`, error)
      throw new Error('cannot reach etherscan - please try again in a minute.')
    }
  } else {
    logger.error(`etherscan api down: ${response.data}`, {
      ethescanData: response.data,
    })
    throw new Error('cannot reach etherscan - please try again in a minute.')
  }
}

export async function getInternalTxnsByHash(txhash: string) {
  const logger = cryptoLogger('ethereum/getInternalTxnsByHash', {
    userId: null,
  })

  if (!config.etherscan.enabled) {
    logger.error(
      'etherscan manually disabled, returning null from getInternalTxnByHash',
      { etherscan: config.etherscan },
    )
    return []
  }

  const params = {
    ...defaultParams,
    module: 'account',
    action: 'txlistinternal',
    txhash,
  }

  const response = await axios.get<any, EtherscanTxListInternalResponse>(
    baseUrl,
    {
      params,
    },
  )

  if (!response.data || !response.data?.result) {
    logger.error(`etherscan api down: ${response.data}`, {
      ethescanData: response.data,
    })
    throw 'cannot reach etherscan - please try again in a minute.'
  }

  const reduced = reduceInternalTransactions(response.data.result)

  // For some reason this endpoint doesn't return the hash, add it here.
  return reduced.map(tx => ({
    ...tx,
    hash: txhash,
  }))
}
export async function getGasRecommendations(): Promise<EtherscanGasOracelResult | null> {
  const logger = cryptoLogger('ethereum/getGasRecommendations', {
    userId: null,
  })

  if (!config.etherscan.enabled) {
    logger.error(
      'etherscan manually disabled, returning null from getGasRecommendations',
      { etherscan: config.etherscan },
    )
    return null
  }
  const params = {
    ...defaultParams,
    module: 'gastracker',
    action: 'gasoracle',
  }

  /** Always use mainnet to estimate fees */
  const response: EtherscanGasOracleResponse = await axios.get(feeUrl, {
    params,
  })

  logger.info(
    `getGasRecommendations: ${
      response.data ? response.data.result : 'No result'
    }`,
    { gasRecommendations: response.data ? response.data.result : 'No result' },
  )

  if (response.data && response.data.result) {
    const data = response.data.result
    return data
  } else {
    logger.error(`etherscan api down: ${response.data}`, {
      ethescanData: response.data,
    })
    throw 'cannot reach etherscan - please try again in a minute.'
  }
}

export async function getInternalTransactionsForBlock(
  blockNumber: number,
  page = 0,
): Promise<EtherscanInternalTransaction[]> {
  const logger = cryptoLogger('ethereum/getInternalTransactionsForBlock', {
    userId: null,
  })

  if (!config.etherscan.enabled) {
    logger.error(
      'etherscan manually disabled, returning [] from getInternalTransactionsForBlock',
      { etherscan: config.etherscan },
    )
    return []
  }
  const params = {
    ...defaultParams,
    module: 'account',
    action: 'txlistinternal',
    startblock: blockNumber,
    endblock: blockNumber,
    offset: 10000,
    page,
  }

  const response: EtherscanTxListInternalResponse = await axios.get(baseUrl, {
    params,
  })

  if (!response.data || !response.data?.result) {
    logger.error(`etherscan api down: ${response.data}`, {
      ethescanData: response.data,
    })
    throw new Error('cannot reach etherscan - please try again in a minute.')
  }

  return reduceInternalTransactions(response.data.result)
}
