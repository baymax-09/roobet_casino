import { config } from 'src/system'
import {
  type EthereumCryptoProperName,
  type ERC20Token,
  type ERC20ProperNameLowercase,
} from '../types'

export const wsUrl = config.ethereum.wsProvider
export const httpUrl = config.ethereum.httpProvider

export interface ERC20TokenData {
  contractAddress: string
  decimals: number
  cryptoType: EthereumCryptoProperName
  depositType: ERC20ProperNameLowercase
}

export const ERC20MapGoerli: Record<ERC20Token, ERC20TokenData> = {
  usdt: {
    contractAddress: config.ethereum.erc20ContractAddresses.usdtTestAddress,
    decimals: 6,
    cryptoType: 'Tether',
    depositType: 'tether',
  },
  usdc: {
    contractAddress: config.ethereum.erc20ContractAddresses.usdcTestAddress,
    decimals: 6,
    cryptoType: 'USDC',
    depositType: 'usdc',
  },
}

export const ERC20Map: Record<ERC20Token, ERC20TokenData> = {
  usdt: {
    contractAddress: config.ethereum.erc20ContractAddresses.usdt,
    decimals: 6,
    cryptoType: 'Tether',
    depositType: 'tether',
  },
  usdc: {
    contractAddress: config.ethereum.erc20ContractAddresses.usdc,
    decimals: 6,
    cryptoType: 'USDC',
    depositType: 'usdc',
  },
}

export const getERC20Config = (token: ERC20Token) => {
  if (!config.isProd) {
    return ERC20MapGoerli[token]
  }

  return ERC20Map[token]
}
