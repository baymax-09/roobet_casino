import * as t from 'io-ts'

import { config } from 'src/system'
import { createObjectFromArray } from 'src/util/helpers/lists'

export const TRC20Tokens = ['usdt', 'usdc'] as const
export const TRC20TokensV = t.keyof(createObjectFromArray(TRC20Tokens))
export type TRC20Token = t.TypeOf<typeof TRC20TokensV>
export const isTRC20Token = (value: unknown): value is TRC20Token =>
  TRC20TokensV.is(value)

export const TronFrozenAssets = ['BANDWIDTH', 'ENERGY'] as const
export const TronFrozenAssetsV = t.keyof(
  createObjectFromArray(TronFrozenAssets),
)
export type TronFrozenAsset = t.TypeOf<typeof TronFrozenAssetsV>
export const isTronFrozenAsset = (value: unknown): value is TronFrozenAsset =>
  TronFrozenAssetsV.is(value)

export const TronStakeModes = ['freeze', 'unfreeze'] as const
export const TronStakeModesV = t.keyof(createObjectFromArray(TronStakeModes))
export type TronStakeMode = t.TypeOf<typeof TronStakeModesV>
export const isTronStakeMode = (value: unknown): value is TronStakeMode =>
  TronStakeModesV.is(value)
export const TRC20TokenAddress: Record<TRC20Token, string> = {
  usdt: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  usdc: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
}

export const TronTokens = ['trx', ...TRC20Tokens] as const
export const TronTokensV = t.keyof(createObjectFromArray(TronTokens))
export type TronToken = t.TypeOf<typeof TronTokensV>
export const isTronToken = (value: unknown): value is TronToken =>
  TronTokensV.is(value)
export const TRC20TokenAddressMap: Record<
  TRC20Token,
  { address: string; decimals: number }
> = config.tron.trc20ContractAddresses

export const AcceptedMethodNames = ['transfer', 'transferFrom'] as const
export const AcceptedMethodNamesV = t.keyof(
  createObjectFromArray(AcceptedMethodNames),
)
export type AcceptedMethodName = t.TypeOf<typeof AcceptedMethodNamesV>
