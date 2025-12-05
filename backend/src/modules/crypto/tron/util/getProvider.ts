import TronWeb from 'tronweb'

import { config } from 'src/system'
import {
  derivePoolingWallet,
  derivePrimaryWallet,
  deriveTronUserWallet,
} from 'src/modules/crypto/tron/lib/wallet'

import { type TRC20Token, TRC20TokenAddressMap } from '../types'

interface SignatureProviderResult {
  provider: TronWeb
  privateKey: string
}

export function getProviderForTrxTransactionSignatures(
  privateKey: string,
): TronWeb {
  const tronWeb = new TronWeb({
    fullHost: config.tron.httpProvider,
    solidityNode: config.tron.httpProvider,
    eventServer: config.tron.httpProvider,
    privateKey,
  })

  return tronWeb
}

async function getProviderForTRC20TransactionSignatures(
  privateKey: string,
  tokenAddress: string,
): Promise<{ tronWeb: TronWeb; contract: any }> {
  const tronWeb = new TronWeb({
    fullHost: config.tron.httpProvider,
    solidityNode: config.tron.httpProvider,
    eventServer: config.tron.httpProvider,
    privateKey,
  })

  // TODO lookup contract address by token
  const contract = await tronWeb.contract([], tokenAddress).at(tokenAddress) // trc-20 contract address

  return { tronWeb, contract }
}

export function getProvider(): TronWeb {
  const tronWeb = new TronWeb({
    fullHost: config.tron.httpProvider,
  })

  return tronWeb
}

export function getSolidityProvider() {
  const tronweb = new TronWeb({
    fullHost: config.tron.httpProvider,
    solidityNode: config.tron.httpProvider,
  })

  return tronweb
}

export function getTrxMainWalletProvider(): SignatureProviderResult {
  const { privateKey } = derivePrimaryWallet()
  return {
    provider: getProviderForTrxTransactionSignatures(privateKey),
    privateKey,
  }
}

export function getTrxPoolingWalletProvider(): SignatureProviderResult {
  const { privateKey } = derivePoolingWallet()
  return {
    provider: getProviderForTrxTransactionSignatures(privateKey),
    privateKey,
  }
}

export function getTrxProvider(walletIndex: number): SignatureProviderResult {
  const { privateKey } = deriveTronUserWallet(walletIndex)
  return {
    provider: getProviderForTrxTransactionSignatures(privateKey),
    privateKey,
  }
}

export async function getTRC20MainWalletContractProvider(token: TRC20Token) {
  const { privateKey } = derivePrimaryWallet()
  return getProviderForTRC20TransactionSignatures(
    privateKey,
    TRC20TokenAddressMap[token].address,
  )
}

export async function getTRC20PoolingWalletContractProvider(token: TRC20Token) {
  const { privateKey } = derivePoolingWallet()
  return getProviderForTRC20TransactionSignatures(
    privateKey,
    TRC20TokenAddressMap[token].address,
  )
}

export async function getTRC20ContractProvider(
  walletIndex: number,
  token: TRC20Token,
) {
  const { privateKey } = deriveTronUserWallet(walletIndex)
  return getProviderForTRC20TransactionSignatures(
    privateKey,
    TRC20TokenAddressMap[token].address,
  )
}
