import * as t from 'io-ts'

import { createObjectFromArray } from 'src/util/helpers/lists'

export const ERC20ProperNameList = ['Tether', 'USDC'] as const
export const ERC20ProperNameV = t.keyof(
  createObjectFromArray(ERC20ProperNameList),
)
export type ERC20ProperName = t.TypeOf<typeof ERC20ProperNameV>
export const isERC20ProperName = (token: unknown): token is ERC20ProperName =>
  ERC20ProperNameV.is(token)

export const EthereumCryptoProperNameList = [
  ...ERC20ProperNameList,
  'Ethereum',
] as const
export const EthereumCryptoProperNameV = t.keyof(
  createObjectFromArray(EthereumCryptoProperNameList),
)
export type EthereumCryptoProperName = t.TypeOf<
  typeof EthereumCryptoProperNameV
>
export const isEthereumCryptoProperName = (
  value: unknown,
): value is EthereumCryptoProperName => EthereumCryptoProperNameV.is(value)

export const ERC20ProperNameLowercaseList = ['tether', 'usdc'] as const
export const ERC20ProperNameLowercaseV = t.keyof(
  createObjectFromArray(ERC20ProperNameLowercaseList),
)
export type ERC20ProperNameLowercase = t.TypeOf<
  typeof ERC20ProperNameLowercaseV
>
export const isERC20LowercaseName = (
  token: unknown,
): token is ERC20ProperNameLowercase => ERC20ProperNameLowercaseV.is(token)

export const EthereumCryptoProperNameLowercaseList = [
  ...ERC20ProperNameLowercaseList,
  'ethereum',
] as const
export const EthereumCryptoProperNameLowercaseV = t.keyof(
  createObjectFromArray(EthereumCryptoProperNameLowercaseList),
)
export type EthereumCryptoProperNameLowercase = t.TypeOf<
  typeof EthereumCryptoProperNameLowercaseV
>
export const isEthereumCryptoLowercaseName = (
  value: unknown,
): value is EthereumCryptoProperNameLowercase =>
  EthereumCryptoProperNameLowercaseV.is(value)

export const ERC20Tokens = ['usdc', 'usdt'] as const
export const ERC20TokenV = t.keyof(createObjectFromArray(ERC20Tokens))
export type ERC20Token = t.TypeOf<typeof ERC20TokenV>
export const isERC20Token = (value: unknown): value is ERC20Token =>
  ERC20TokenV.is(value)

export const ETHTokens = [...ERC20Tokens, 'eth'] as const
export const ETHTokenV = t.keyof(createObjectFromArray(ETHTokens))
export type ETHToken = t.TypeOf<typeof ETHTokenV>
export const isETHToken = (value: unknown): value is ETHToken =>
  ETHTokenV.is(value)
