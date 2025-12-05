import Web3 from 'web3'
import { fromWei } from 'web3-utils'

import { getERC20Config } from 'src/modules/crypto/ethereum/lib'
import { getCurrencyPair } from 'src/modules/currency'
import { config } from 'src/system'

import { erc20ABI } from './abi/erc20'
import { convertEtherToUserBalance } from '..'
import { type ERC20Token } from '../types'

export async function getEthBalance(address: string) {
  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)
  const balanceWei = await web3.eth.getBalance(address)
  const balanceEth = parseFloat(fromWei(balanceWei.toString(), 'ether'))
  const balanceUSD = await convertEtherToUserBalance(balanceEth)

  provider.disconnect()

  return {
    balanceUSD,
    balanceWei,
    balanceETH: balanceEth,
  }
}

export async function getERC20Balance(address: string, token: ERC20Token) {
  const { contractAddress, decimals } = getERC20Config(token)
  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)
  const erc20Contract = new web3.eth.Contract(erc20ABI, contractAddress)
  const unformattedBalance: string = await erc20Contract.methods
    .balanceOf(address)
    .call()
  const formattedBalance = parseInt(unformattedBalance) / 10 ** decimals
  const pair = await getCurrencyPair(token, 'usd')

  provider.disconnect()

  if (!pair || !pair.exchangeRate) {
    throw new Error('missing exchange rate for ' + token)
  }

  return {
    balanceUSD: formattedBalance * pair.exchangeRate,
    balanceAtomicUnits: unformattedBalance,
    balanceFormattedUnits: formattedBalance,
  }
}
