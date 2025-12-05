import type Web3 from 'web3'
import { fromWei, toBN } from 'web3-utils'

import { config } from 'src/system'
import { getGasPrice } from 'src/modules/crypto/ethereum'
import { getBalancesByToken } from 'src/modules//crypto/ethereum/documents/ethereum_balances'
import { executeBatchAsync } from 'src/modules/crypto/ethereum/util'

import { analyticsLogger } from '../logger'
import { type AllBalances } from './defaults'

const getEthereumBalanceForStats = async (
  web3: Web3,
  address: string,
  rate: number,
) => {
  const wei = await web3.eth.getBalance(address)
  const ethBalance = parseFloat(web3.utils.fromWei(wei.toString(), 'ether'))
  const ethfiat = Math.floor(ethBalance * rate)

  return {
    eth: ethBalance,
    fiat: ethfiat,
  }
}

export const getEthereumFees = async (isERC20: boolean) => {
  const { erc20, standard } = config.ethereum.gasLimit
  const gasLimit = isERC20 ? erc20 : standard
  const gasPrice = await getGasPrice()
  const gasCostWei = toBN(gasPrice).mul(toBN(gasLimit)).toString()
  return parseFloat(fromWei(gasCostWei, 'ether'))
}

export const fetchEthBalances = async (
  ethRate: number,
  createBatch: () => InstanceType<Web3['BatchRequest']>,
  mainAddress: string,
  web3: Web3,
): Promise<AllBalances['eth'] | undefined> => {
  const logger = analyticsLogger('fetchEthBalances', { userId: null })

  try {
    const batchForEth = createBatch()
    const { eth, fiat } = await getEthereumBalanceForStats(
      web3,
      mainAddress,
      ethRate,
    )

    const unpooledBalanceDocs = await getBalancesByToken('eth')

    // sum ETH unpooled balances
    let balanceInEth = 0
    try {
      // build batch request
      for (const balance of unpooledBalanceDocs) {
        // @ts-expect-error there is a request method on these, but Web3's types are wrong
        const balanceRequest = web3.eth.getBalance.request(
          balance.address,
          'latest',
        )
        batchForEth.add(balanceRequest)
      }

      // execute batch request and get response array
      const response = await executeBatchAsync<string[], string>(batchForEth)

      // convert amounts and sum
      response.forEach(amountInWei => {
        const amountInEth = parseFloat(
          web3.utils.fromWei(amountInWei.toString(), 'ether'),
        )
        balanceInEth += amountInEth
      })
    } catch (error) {
      logger.error('ETH', {}, error)
    }

    const gasCostEth = await getEthereumFees(false)
    const ethFiat = Math.floor(balanceInEth * ethRate)

    return {
      pending: {
        tokens: balanceInEth,
        usd: ethFiat,
      },
      poolingFees: {
        tokens: gasCostEth * unpooledBalanceDocs.length,
        usd: gasCostEth * ethRate * unpooledBalanceDocs.length,
      },
      confirmed: {
        tokens: eth,
        usd: fiat,
      },
    }
  } catch (error) {
    logger.error('error getting eth balance', error)
    return undefined
  }
}
