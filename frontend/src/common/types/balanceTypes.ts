import { type CryptoPlugin } from 'app/constants'

const UserObjectBalanceTypes = ['cash', 'crypto', 'eth', 'ltc'] as const
type UserObjectBalanceType = (typeof UserObjectBalanceTypes)[number]

export const PortfolioBalanceTypes = [
  'usdt',
  'usdc',
  'xrp',
  'doge',
  'trx',
] as const
export type PortfolioBalanceType = (typeof PortfolioBalanceTypes)[number]

// This is where our development tokens will go
const DevelopmentBalanceTypes = ['trx'] as const
type DevelopmentBalanceType = (typeof DevelopmentBalanceTypes)[number]
export const isDevelopmentBalanceType = (
  value: string,
): value is DevelopmentBalanceType =>
  (DevelopmentBalanceTypes as readonly string[]).includes(value)

export const BalanceTypes = [
  ...UserObjectBalanceTypes,
  ...PortfolioBalanceTypes,
  ...DevelopmentBalanceTypes,
]
export type BalanceType = (typeof BalanceTypes)[number]

export const ERC20FullNames = ['Tether', 'USDC'] as const
export type ERC20FullName = (typeof ERC20FullNames)[number]

export const UserObjectBalanceFields = [
  'balance',
  'cashBalance',
  'ethBalance',
  'ltcBalance',
] as const
export type UserObjectBalanceField = (typeof UserObjectBalanceFields)[number]
export const userObjectBalanceFieldsToBalanceType = (
  balanceField: UserObjectBalanceField,
): UserObjectBalanceType => {
  const map = {
    cashBalance: 'cash',
    ethBalance: 'eth',
    ltcBalance: 'ltc',
    balance: 'crypto',
  } as const
  return map[balanceField]
}

export const isPortfolioBalanceType = (
  value: any,
): value is PortfolioBalanceType => PortfolioBalanceTypes.includes(value)

export const ERC20CodeToFullname: Record<
  Extract<PortfolioBalanceType, 'usdt' | 'usdc'>,
  ERC20FullName
> = {
  usdt: 'Tether',
  usdc: 'USDC',
}

export interface UserBalance extends Record<BalanceType, number> {
  selectedBalanceType: BalanceType
}

export const BalanceFullNamesValues = [
  'BTC',
  'ETH',
  'LTC',
  'USD',
  'Tether',
  'USDC',
  'XRP',
  'Doge',
  'TRX',
] as const
export type BalanceFullNamesType = (typeof BalanceFullNamesValues)[number]

export const balanceTypeToFullname: Record<BalanceType, BalanceFullNamesType> =
  {
    crypto: 'BTC',
    eth: 'ETH',
    ltc: 'LTC',
    cash: 'USD',
    usdt: 'Tether',
    usdc: 'USDC',
    xrp: 'XRP',
    doge: 'Doge',
    trx: 'TRX',
  }

export const withdrawalPluginToBalanceType: Record<CryptoPlugin, BalanceType> =
  {
    bitcoin: 'crypto',
    ethereum: 'eth',
    litecoin: 'ltc',
    ripple: 'xrp',
    tether: 'usdt',
    usdc: 'usdc',
    dogecoin: 'doge',
    tron: 'trx',
  }

export const depositTypeToBalanceType: Record<CryptoPlugin, BalanceType> = {
  bitcoin: 'crypto',
  ethereum: 'eth',
  litecoin: 'ltc',
  ripple: 'xrp',
  tether: 'usdt',
  usdc: 'usdc',
  dogecoin: 'doge',
  tron: 'trx',
}
