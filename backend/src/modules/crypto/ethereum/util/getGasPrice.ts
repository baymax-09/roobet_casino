import Web3 from 'web3'

import { config } from 'src/system'

import {
  getGasPriceUncached,
  getGasPrice as getGasPriceCached,
} from '../lib/fees'

export const getGasPriceUtility = async () => {
  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)

  let gasPrice: number | null = null

  try {
    try {
      gasPrice = await getGasPriceUncached()
    } catch {
      gasPrice = await getGasPriceCached()
    }
  } catch {
    gasPrice = parseInt(await web3.eth.getGasPrice())
  } finally {
    provider.disconnect()
  }

  return gasPrice
}
