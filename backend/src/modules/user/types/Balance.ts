import * as t from 'io-ts'

import { ERC20Tokens } from 'src/modules/crypto/ethereum/types'
import { determineUserTokenFeatureAccess } from 'src/util/features'
import { type User } from 'src/modules/user/types'
import { createObjectFromArray } from 'src/util/helpers/lists'

/** All tokens that are in development should go here  */
export const DevelopmentBalanceTypes = ['trx'] as const
export const DevelopmentBalanceTypesV = t.keyof(
  createObjectFromArray(DevelopmentBalanceTypes),
)
type DevelopmentBalanceType = t.TypeOf<typeof DevelopmentBalanceTypesV>
export const isDevelopmentBalanceType = (
  value: unknown,
): value is DevelopmentBalanceType => DevelopmentBalanceTypesV.is(value)

/** @deprecated only to be used when the input is possibly a balanceField */
export type BalanceIdentifier = UserObjectBalanceField | BalanceType

export const PortfolioBalanceTypes = [
  ...ERC20Tokens,
  'xrp',
  'doge',
  'trx',
] as const
export const PortfolioBalanceTypesV = t.keyof(
  createObjectFromArray(PortfolioBalanceTypes),
)
export type PortfolioBalanceType = t.TypeOf<typeof PortfolioBalanceTypesV>
export const isPortfolioBalanceType = (
  value: unknown,
): value is PortfolioBalanceType => PortfolioBalanceTypesV.is(value)

const UserObjectCryptoBalanceTypes = ['eth', 'crypto', 'ltc'] as const
export const UserObjectCryptoBalanceTypesV = t.keyof(
  createObjectFromArray(UserObjectCryptoBalanceTypes),
)
export type UserObjectCryptoBalanceType = t.TypeOf<
  typeof UserObjectCryptoBalanceTypesV
>

/**
 * We have different wager requirements between cash and crypto, PortfolioBalanceType isn't appropriate here because
 * it could contain fiat currencies in the future.
 */
export const CryptoBalanceTypes = [
  ...PortfolioBalanceTypes,
  ...UserObjectCryptoBalanceTypes,
] as const
export const CryptoBalanceTypesV = t.keyof(
  createObjectFromArray(CryptoBalanceTypes),
)
export type CryptoBalanceType = t.TypeOf<typeof CryptoBalanceTypesV>
export const isCryptoBalanceType = (
  value: unknown,
): value is CryptoBalanceType => CryptoBalanceTypesV.is(value)

export const UserObjectBalanceTypes = [
  'cash',
  ...UserObjectCryptoBalanceTypes,
] as const
export const UserObjectBalanceTypesV = t.keyof(
  createObjectFromArray(UserObjectBalanceTypes),
)
export type UserObjectBalanceType = t.TypeOf<typeof UserObjectBalanceTypesV>
export const isUserObjectBalanceType = (
  balanceIdentifier: unknown,
): balanceIdentifier is UserObjectBalanceType => {
  return UserObjectBalanceTypesV.is(balanceIdentifier)
}

export const BalanceTypes = [
  ...UserObjectBalanceTypes,
  ...PortfolioBalanceTypes,
] as const
export const BalanceTypesV = t.keyof(createObjectFromArray(BalanceTypes))
export type BalanceType = t.TypeOf<typeof BalanceTypesV>
export const isBalanceType = (
  balanceIdentifier: unknown,
): balanceIdentifier is BalanceType => {
  return BalanceTypesV.is(balanceIdentifier)
}

export const DevelopmentTokenTypes = ['tron:usdt', 'tron:usdc'] as const

export const UserObjectBalanceFields = [
  'balance',
  'cashBalance',
  'ethBalance',
  'ltcBalance',
] as const
export const UserObjectBalanceFieldsV = t.keyof(
  createObjectFromArray(UserObjectBalanceFields),
)
export type UserObjectBalanceField = t.TypeOf<typeof UserObjectBalanceFieldsV>
export const isUserObjectBalanceField = (
  balanceIdentifier: unknown,
): balanceIdentifier is UserObjectBalanceField => {
  return UserObjectBalanceFieldsV.is(balanceIdentifier)
}

export type UserBalances = Record<BalanceType, number> & {
  selectedBalanceType: BalanceType
}

export type SelectedBalanceField = UserObjectBalanceField | PortfolioBalanceType

type AvailableBalanceTypes = Record<
  BalanceType,
  {
    shortCode: string
    name: string
  }
>

// This map is used for display purposes.
export const AVAILABLE_BALANCE_TYPES: AvailableBalanceTypes = {
  crypto: {
    name: 'Bitcoin',
    shortCode: 'BTC',
  },
  eth: {
    name: 'Ethereum',
    shortCode: 'ETH',
  },
  ltc: {
    name: 'Litecoin',
    shortCode: 'LTC',
  },
  usdc: {
    name: 'USD Coin',
    shortCode: 'USDC',
  },
  usdt: {
    name: 'Tether',
    shortCode: 'USDT',
  },
  xrp: {
    name: 'Ripple',
    shortCode: 'XRP',
  },
  doge: {
    name: 'Dogecoin',
    shortCode: 'DOGE',
  },
  trx: {
    name: 'Tron',
    shortCode: 'TRX',
  },
  cash: {
    name: 'Cash',
    shortCode: 'Cash',
  },
}

export const getAvailableBalanceTypes = async (user: User) => {
  return await Object.entries(AVAILABLE_BALANCE_TYPES).reduce<
    Promise<Partial<AvailableBalanceTypes>>
  >(async (accPromise, [key, value]) => {
    const acc = await accPromise
    const canUseToken = await determineUserTokenFeatureAccess({
      token: key,
      user,
      countryCode: '',
    })
    if (canUseToken) {
      acc[key as BalanceType] = value
    }
    return acc
  }, Promise.resolve({}))
}
