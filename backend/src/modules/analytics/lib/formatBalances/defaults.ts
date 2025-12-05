import { type CryptoBalanceType } from 'src/modules/user/balance'

export interface BalanceRepresentation {
  confirmed: {
    tokens: number
    usd: number
  }
  pending?: {
    tokens: number
    usd: number
  }
  poolingFees?: {
    tokens: number
    usd: number
  }
}

export type CryptoBalances = Record<
  CryptoBalanceType,
  BalanceRepresentation | undefined
>

/** This is a function and not an object so we can modify the structures without mutating global values. */
export const defaultBalances = () =>
  ({
    crypto: {
      confirmed: { tokens: 0, usd: 0 },
      pending: { tokens: 0, usd: 0 },
    },
    eth: {
      confirmed: { tokens: 0, usd: 0 },
      pending: { tokens: 0, usd: 0 },
      poolingFees: { tokens: 0, usd: 0 },
    },
    ltc: {
      confirmed: { tokens: 0, usd: 0 },
      pending: { tokens: 0, usd: 0 },
    },
    usdc: {
      confirmed: { tokens: 0, usd: 0 },
      pending: { tokens: 0, usd: 0 },
      poolingFees: { tokens: 0, usd: 0 },
    },
    usdt: {
      confirmed: { tokens: 0, usd: 0 },
      pending: { tokens: 0, usd: 0 },
      poolingFees: { tokens: 0, usd: 0 },
    },
    xrp: {
      confirmed: { tokens: 0, usd: 0 },
    },
    doge: {
      confirmed: { tokens: 0, usd: 0 },
      pending: { tokens: 0, usd: 0 },
    },
    trx: {
      confirmed: { tokens: 0, usd: 0 },
      pending: { tokens: 0, usd: 0 },
      poolingFees: { tokens: 0, usd: 0 },
    },
  }) satisfies CryptoBalances

export type AllBalances = ReturnType<typeof defaultBalances>
