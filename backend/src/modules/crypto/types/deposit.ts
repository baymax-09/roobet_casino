import { type BalanceType } from 'src/modules/user/types'

import { type CryptoLowercase } from './enums'
import {
  type EthereumTransaction,
  type EthereumDeposit,
} from '../ethereum/types'
import { type RippleTransaction, type RippleDeposit } from '../ripple/types'
import {
  type Transaction as TronTransaction,
  type TronDeposit,
} from '../tron/types'

export class DepositError extends Error {
  code?: number

  constructor(message: string, code = 99999) {
    super(message)

    this.code = code

    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

export type CryptoTransaction =
  | RippleTransaction
  | EthereumTransaction
  | TronTransaction

export type CryptoDepositPayload = EthereumDeposit | RippleDeposit | TronDeposit

export const CryptoToBalanceTypeMap: Record<CryptoLowercase, BalanceType> = {
  bitcoin: 'crypto',
  ethereum: 'eth',
  litecoin: 'ltc',
  tether: 'usdt',
  usdc: 'usdc',
  ripple: 'xrp',
  dogecoin: 'doge',
  tron: 'trx',
}
