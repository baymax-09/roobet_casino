import Web3 from 'web3'
import { toWei, fromWei } from 'web3-utils'
import { config } from 'src/system'
import { BasicCache } from 'src/util/redisModels'

import { convertEtherToUserBalance } from '..'
import { getProvider } from '../util/getProvider'
import { erc20ABI } from './abi/erc20'
import { getERC20Config } from '.'
import { getGasRecommendations } from './etherscan'
import { type ERC20Token, isETHToken, isERC20Token } from '../types'
import type { CryptoToken } from '../../types'
import { cryptoLogger } from '../../lib/logger'

const { maxFeeUSD } = config.ethereum.fee

const adjustFee = (fee: number) => Math.min(fee, maxFeeUSD)

export async function estimateERC20Fee(token: ERC20Token) {
  const { contractAddress } = getERC20Config(token)
  const secret = config.ethereum.ethSecret
  const walletIndex = config.ethereum.ethSecretIndex
  const { web3, provider, contract } = getProvider(
    secret,
    walletIndex,
    contractAddress,
    erc20ABI,
  )

  try {
    const gasPrice = await getGasPrice()
    // We are estimating the fee when sending 1e-6 USDT from our primary address at `walletIndex`
    // to the arbitrary address `walletIndex + 1`.
    // This estimate assumes and requires that our primary wallet has a balance of USDT.
    const [from, to] = await web3.eth.getAccounts()

    const estimateGas: string = await contract.methods
      .transfer(to, 1)
      .estimateGas({
        from,
      })
    const gasCostWei = gasPrice * parseInt(estimateGas)
    const gasInEther = web3.utils.fromWei(gasCostWei.toString(), 'ether')

    const fee = await convertEtherToUserBalance(parseFloat(gasInEther))
    return { fee: adjustFee(fee) }
  } catch (error) {
    cryptoLogger('ethereum/estimateERC20Fee', { userId: null }).error(
      `Error estimating USDT fee: ${error.message}`,
      {},
      error,
    )
  } finally {
    provider.engine.stop()
  }

  return { fee: maxFeeUSD }
}

export async function estimateEthereumFee() {
  const gasPrice = await getGasPrice()
  const gas = gasPrice * 21000
  const gasString = gas.toString()
  const gasInEther = fromWei(gasString, 'ether')

  const fee = await convertEtherToUserBalance(parseFloat(gasInEther))
  return { fee: adjustFee(fee) }
}

export async function getEthereumFee(token: CryptoToken = 'eth') {
  if (!isETHToken(token)) {
    return { fee: 0 }
  }

  if (isERC20Token(token)) {
    return estimateERC20Fee(token)
  }

  return estimateEthereumFee()
}

/**
 * Get the cached gas price in wei
 * @param superSpeed
 * @returns wei
 */
export async function getGasPrice(superSpeed = false): Promise<number> {
  return await BasicCache.multilevelCache(
    'getGasPrice',
    30,
    60 * 10,
    async () => await getGasPriceUncached(superSpeed),
  )
}

/**
 * Get the current gas price in wei
 * @param superSpeed
 * @returns wei
 */
export async function getGasPriceUncached(superSpeed = false): Promise<number> {
  const logger = cryptoLogger('ethereum/getGasPriceUncached', { userId: null })
  try {
    // try and fetch gas price from our eth node
    const gasPrice = await getGasRecommendationWeb3()
    // if nothing comes back that means error - lets try etherscan
    if (!gasPrice) {
      logger.error(
        'getGasPriceWeb3 Error attempting to fetch from Etherscan...',
        { gasPrice },
      )
      try {
        const etherScanResponse = await getGasRecommendations()
        // No gas price for you...
        if (!etherScanResponse) {
          logger.error(
            'Unable to get gas price from Web3 and Etherscan returned null!!',
            { etherScanResponse },
          )
          throw new Error(
            'Web3 did not return a gas price, and Etherscan returned null!',
          )
        }
        // convert etherscan gas price
        const etherScanFastPrice = parseInt(etherScanResponse.FastGasPrice)
        // if super speed is added bump the gas fee
        return superSpeed
          ? convertWeiToGwei(etherScanFastPrice * 1.5)
          : convertWeiToGwei(etherScanFastPrice)
      } catch (error) {
        logger.error(
          `Unable to get gas price from Web3 or Etherscan - ${error.message}`,
          error,
        )
        throw new Error(error)
      }
    } else {
      // what should normally happen...if super speed is added bump the gas fee
      return superSpeed ? gasPrice * 1.5 : gasPrice
    }
  } catch (error) {
    logger.error(`getGasPrice error - ${error.message}`, error)
    throw error
  }
}

/**
 * Get the current gas price in wei
 * @param superSpeed
 * @returns wei
 */
export const getGasRecommendationWeb3 = async (): Promise<
  number | null | undefined
> => {
  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)
  try {
    const gasPrice = await web3.eth.getGasPrice()
    const web3GasPrice = parseInt(gasPrice)
    return web3GasPrice
  } catch (error) {
    cryptoLogger('ethereum/getGasRecommendationWeb3', { userId: null }).error(
      `Error fetching gas price from Ethereum node - ${error.message}`,
      error,
    )
    return null
  }
}

const convertWeiToGwei = (price: number): number => {
  return parseInt(toWei(price.toString(), 'Gwei'))
}
