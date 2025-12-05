import HDWalletProvider from '@truffle/hdwallet-provider'
import Web3 from 'web3'

import { config } from 'src/system'
import {
  convertCurrencyToUserBalance,
  convertUserBalanceToCurrency,
} from 'src/modules/currency'

const mnemonic = config.ethereum.mnemonic // BIP39 12 word mnemonic

export async function convertEtherToUserBalance(
  amount: number,
): Promise<number> {
  return await convertCurrencyToUserBalance(amount, 'eth')
}

export async function convertUserBalanceToEther(
  amount: number,
): Promise<number> {
  return await convertUserBalanceToCurrency(amount, 'eth')
}

export async function isSmartContract(address: string) {
  const provider = new Web3.providers.HttpProvider(
    config.ethereum.httpProvider,
    { keepAlive: false },
  )
  const web3 = new Web3(provider)

  const code = await web3.eth.getCode(address)

  provider.disconnect()

  return code !== '0x' || code.length > 2
}

export async function deriveEthWalletAddress(index: number) {
  const walletOptions = {
    mnemonic,
    providerOrUrl: config.ethereum.httpProvider,
    addressIndex: index,
  }
  const provider = new HDWalletProvider(walletOptions)
  const web3 = new Web3(provider)

  // Should only return one address per user - so we can destructure this.
  const [account] = await web3.eth.getAccounts()

  provider.engine.stop()

  return account
}

export async function derivePrimaryEthWalletAddress(): Promise<string> {
  const secret = config.ethereum.ethSecret
  const index = config.ethereum.ethSecretIndex

  const walletOptions = {
    mnemonic: secret,
    providerOrUrl: config.ethereum.httpProvider,
    addressIndex: index,
  }

  const provider = new HDWalletProvider(walletOptions)

  // Should only return one address per user - so we can destructure this.
  const account = provider.getAddress()

  provider.engine.stop()

  return account
}

export * as Documents from './documents'
export * as Workers from './workers'
export * as Routes from './routes'

export {
  estimateEthereumFee,
  estimateERC20Fee,
  getEthereumFee,
  getGasPrice,
  getGasPriceUncached,
} from './lib/fees'
