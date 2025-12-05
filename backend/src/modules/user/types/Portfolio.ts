import { type Types } from 'mongoose'

import { type Currency } from 'src/modules/currency/types'

import { type PortfolioBalanceType } from './Balance'

export interface PortfolioBalance {
  balance: number
  currency: Currency
}

export type UserPortfolioBalances = Record<
  PortfolioBalanceType,
  PortfolioBalance
>

export interface UserPortfolio {
  _id: Types.ObjectId
  userId: string
  balances: UserPortfolioBalances
}
