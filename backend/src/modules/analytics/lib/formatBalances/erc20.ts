import Web3 from 'web3'

import { config } from 'src/system'

import { getERC20Balance } from 'src/modules/crypto/ethereum/lib/balance'
import { getERC20Config } from 'src/modules/crypto/ethereum/lib'
import { erc20ABI } from 'src/modules/crypto/ethereum/lib/abi/erc20'
import { getBalancesByToken } from 'src/modules/crypto/ethereum/documents/ethereum_balances'
import { executeBatchAsync } from 'src/modules/crypto/ethereum/util'

import { getEthereumFees } from './eth'
import { analyticsLogger } from '../logger'
import { defaultBalances, type AllBalances } from './defaults'

type ERC20Balance = 'usdt' | 'usdc'

export const fetchErc20Balance = async <T extends ERC20Balance>(
  token: T,
  getRate: (token: string) => number,
  createBatch: () => InstanceType<Web3['BatchRequest']>,
  mainAddress: string,
): Promise<AllBalances[T] | undefined> => {
  const logger = analyticsLogger('fetchErc20Balances', { userId: null })
  const ethRate = getRate('eth')

  const result = defaultBalances()[token]

  const batchForToken = createBatch()
  const erc20Rate = getRate(token) || 1
  // gasCost is still in ETH
  const gasCostERC20 = await getEthereumFees(true)

  try {
    const { balanceUSD, balanceFormattedUnits } = await getERC20Balance(
      mainAddress,
      token,
    )

    result.confirmed.tokens = balanceFormattedUnits
    result.confirmed.usd = balanceUSD
  } catch (error) {
    logger.error('error getting balance', { token }, error)
    return undefined
  }

  const unpooledTokenBalanceDocs = await getBalancesByToken(token)

  const { contractAddress, decimals } = getERC20Config(token)
  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)
  const erc20Contract = new web3.eth.Contract(erc20ABI, contractAddress)

  // sum ERC20 token unpooled balances
  let balanceInTokens = 0
  try {
    // build batch request
    for (const balance of unpooledTokenBalanceDocs) {
      const balanceRequest = erc20Contract.methods
        .balanceOf(balance.address)
        .call.request({})
      batchForToken.add(balanceRequest)
    }

    // execute batch request and get response array
    const response = await executeBatchAsync<string[], string>(batchForToken)

    // convert amounts and sum
    for (const unformattedBalance of response) {
      const formattedBalance = parseInt(unformattedBalance) / 10 ** decimals
      balanceInTokens += formattedBalance
    }
  } catch (error) {
    logger.error('ERC20 Unpooled', {}, error)
    return undefined
  }

  const balanceInUsd = balanceInTokens * erc20Rate

  result.pending.tokens = balanceInTokens
  result.pending.usd = balanceInUsd
  result.poolingFees.tokens =
    gasCostERC20 * ethRate * unpooledTokenBalanceDocs.length
  result.poolingFees.usd =
    gasCostERC20 * ethRate * unpooledTokenBalanceDocs.length

  return result
}
