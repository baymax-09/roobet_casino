import React from 'react'

import { type BalanceType } from 'common/types'

import {
  CryptoDepositOption,
  type CryptoDepositOptionProps,
} from './CryptoDepositOption'
import { TronDepositOption } from './TronDepositOption'

export const CryptoDepositOptionMap: Record<
  Exclude<BalanceType, 'xrp' | 'cash'>,
  React.FC<CryptoDepositOptionProps>
> = {
  crypto: (props: CryptoDepositOptionProps) => (
    <CryptoDepositOption {...props} />
  ),
  eth: (props: CryptoDepositOptionProps) => <CryptoDepositOption {...props} />,
  ltc: (props: CryptoDepositOptionProps) => <CryptoDepositOption {...props} />,
  doge: (props: CryptoDepositOptionProps) => <CryptoDepositOption {...props} />,
  trx: (props: CryptoDepositOptionProps) => <TronDepositOption {...props} />,
  usdc: (props: CryptoDepositOptionProps) => <CryptoDepositOption {...props} />,
  usdt: (props: CryptoDepositOptionProps) => <CryptoDepositOption {...props} />,
}

export * from './CashOption'
export * from './RippleDepositOption'
