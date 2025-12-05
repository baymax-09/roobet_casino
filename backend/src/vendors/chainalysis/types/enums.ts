import * as t from 'io-ts'

import {
  type CryptoLowercase,
  type CryptoSymbol,
} from 'src/modules/crypto/types'
import { createObjectFromArray } from 'src/util/helpers/lists'

export const Assets = [
  'BTC',
  'LTC',
  'ETH',
  'USDT',
  'USDC',
  'XRP',
  'DOGE',
  'TRX',
] as const
export const AssetsV = t.keyof(createObjectFromArray(Assets))
export type ChainalysisAsset = t.TypeOf<typeof AssetsV>
export const isAssetType = (value: unknown): value is ChainalysisAsset =>
  AssetsV.is(value)

export const ChainalysisNetworks = [
  'Ethereum',
  'Bitcoin',
  'Litecoin',
  'XRP',
  'Dogecoin',
  'Tron',
] as const
export const ChainalysisNetworksV = t.keyof(
  createObjectFromArray(ChainalysisNetworks),
)
export type ChainalysisNetwork = t.TypeOf<typeof ChainalysisNetworksV>
export const isChainalysisNetwork = (
  value: unknown,
): value is ChainalysisNetwork => ChainalysisNetworksV.is(value)

export const SymbolToNetworkMap: Record<CryptoSymbol, ChainalysisNetwork> = {
  btc: 'Bitcoin',
  ltc: 'Litecoin',
  eth: 'Ethereum',
  usdt: 'Ethereum',
  usdc: 'Ethereum',
  xrp: 'XRP',
  trx: 'Tron',
  doge: 'Dogecoin',
}

export const TransferMap: Record<
  CryptoLowercase,
  { network: ChainalysisNetwork; asset: ChainalysisAsset }
> = {
  bitcoin: {
    network: 'Bitcoin',
    asset: 'BTC',
  },
  litecoin: {
    network: 'Litecoin',
    asset: 'LTC',
  },
  ethereum: {
    network: 'Ethereum',
    asset: 'ETH',
  },
  dogecoin: {
    network: 'Dogecoin',
    asset: 'DOGE',
  },
  tether: {
    network: 'Ethereum',
    asset: 'USDT',
  },
  usdc: {
    network: 'Ethereum',
    asset: 'USDC',
  },
  ripple: {
    network: 'XRP',
    asset: 'XRP',
  },
  tron: {
    network: 'Tron',
    asset: 'TRX',
  },
}
