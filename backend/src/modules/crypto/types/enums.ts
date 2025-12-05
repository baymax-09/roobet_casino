import * as t from 'io-ts'

import { createObjectFromArray } from 'src/util/helpers/lists'

import {
  ETHTokens,
  EthereumCryptoProperNameLowercaseList,
  EthereumCryptoProperNameList,
  type ETHToken,
} from '../ethereum/types'
import { type TronToken } from '../tron/types'

export const BlockioCryptoProperNameList = [
  'Litecoin',
  'Bitcoin',
  'Dogecoin',
] as const
export const BlockioCryptoProperNameV = t.keyof(
  createObjectFromArray(BlockioCryptoProperNameList),
)
export type BlockioCryptoProperName = t.TypeOf<typeof BlockioCryptoProperNameV>
export const isBlockioCryptoProperName = (
  value: unknown,
): value is BlockioCryptoProperName => BlockioCryptoProperNameV.is(value)

export const BlockioCryptoProperNameLowercaseList = [
  'litecoin',
  'bitcoin',
  'dogecoin',
] as const
export const BlockioCryptoProperNameLowercaseV = t.keyof(
  createObjectFromArray(BlockioCryptoProperNameLowercaseList),
)
export type BlockioCryptoProperNameLowercase = t.TypeOf<
  typeof BlockioCryptoProperNameLowercaseV
>
export const isBlockioCryptoLowercaseName = (
  value: unknown,
): value is BlockioCryptoProperNameLowercase =>
  BlockioCryptoProperNameLowercaseV.is(value)

export const CryptoList = [
  ...BlockioCryptoProperNameList,
  ...EthereumCryptoProperNameList,
  'Ripple',
  'Tron',
] as const
export const CryptoV = t.keyof(createObjectFromArray(CryptoList))
export type Crypto = t.TypeOf<typeof CryptoV>
export const isValidCrypto = (value: unknown): value is Crypto =>
  CryptoV.is(value)

export const CryptoLowercaseList = [
  ...BlockioCryptoProperNameLowercaseList,
  ...EthereumCryptoProperNameLowercaseList,
  'ripple',
  'tron',
] as const
export const CryptoLowercaseV = t.keyof(
  createObjectFromArray(CryptoLowercaseList),
)
export type CryptoLowercase = t.TypeOf<typeof CryptoLowercaseV>
export const isValidLowercaseCrypto = (
  value: unknown,
): value is CryptoLowercase => CryptoLowercaseV.is(value)

export const BlockioCryptoSymbolList = ['btc', 'ltc', 'doge'] as const
export const BlockioCryptoSymbolV = t.keyof(
  createObjectFromArray(BlockioCryptoSymbolList),
)
export type BlockioCryptoSymbol = t.TypeOf<typeof BlockioCryptoSymbolV>
export const isBlockioCryptoSymbol = (
  value: unknown,
): value is BlockioCryptoSymbol => BlockioCryptoSymbolV.is(value)

export const CryptoSymbolList = [
  ...BlockioCryptoSymbolList,
  ...ETHTokens,
  'xrp',
  'trx',
] as const
export const CryptoSymbolsV = t.keyof(createObjectFromArray(CryptoSymbolList))
export type CryptoSymbol = t.TypeOf<typeof CryptoSymbolsV>
export const isCryptoSymbol = (value: unknown): value is CryptoSymbol =>
  CryptoSymbolsV.is(value)

export const CryptoNetworkList = [
  ...BlockioCryptoProperNameList,
  'Ethereum',
  'Ripple',
  'Tron',
] as const
export const CryptoNetworkV = t.keyof(createObjectFromArray(CryptoNetworkList))
export type CryptoNetwork = t.TypeOf<typeof CryptoNetworkV>

export const CryptoNetworkLowercaseList = [
  'bitcoin',
  'litecoin',
  'dogecoin',
  'ethereum',
  'ripple',
  'tron',
] as const
export const CryptoNetworkLowercaseV = t.keyof(
  createObjectFromArray(CryptoNetworkLowercaseList),
)
export type CryptoNetworkLowercase = t.TypeOf<typeof CryptoNetworkLowercaseV>
export const isCryptoNetworkLowercase = (
  value: unknown,
): value is CryptoNetworkLowercase => CryptoNetworkLowercaseV.is(value)

export const BitcoinTokens = ['btc'] as const
export const BitcoinTokensV = t.keyof(createObjectFromArray(BitcoinTokens))
export type BitcoinToken = t.TypeOf<typeof BitcoinTokensV>
export const isBitcoinToken = (value: unknown): value is BitcoinToken =>
  BitcoinTokensV.is(value)

export const LitecoinTokens = ['ltc'] as const
export const LitecoinTokensV = t.keyof(createObjectFromArray(LitecoinTokens))
export type LitecoinToken = t.TypeOf<typeof LitecoinTokensV>
export const isLitecoinToken = (value: unknown): value is LitecoinToken =>
  LitecoinTokensV.is(value)

export const DogecoinTokens = ['doge'] as const
export const DogecoinTokensV = t.keyof(createObjectFromArray(DogecoinTokens))
export type DogecoinToken = t.TypeOf<typeof DogecoinTokensV>
export const isDogecoinToken = (value: unknown): value is DogecoinToken =>
  DogecoinTokensV.is(value)

export const RippleTokens = ['xrp'] as const
export const RippleTokensV = t.keyof(createObjectFromArray(RippleTokens))
export type RippleToken = t.TypeOf<typeof RippleTokensV>
export const isRippleToken = (value: unknown): value is RippleToken =>
  RippleTokensV.is(value)

export type CryptoToken =
  | BitcoinToken
  | LitecoinToken
  | DogecoinToken
  | ETHToken
  | RippleToken
  | TronToken
