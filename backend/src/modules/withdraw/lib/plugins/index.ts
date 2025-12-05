import { APIValidationError } from 'src/util/errors'
import { type Types } from 'src/modules/withdraw'
import { type BalanceType } from 'src/modules/user/types'
import { type Currency } from 'src/modules/currency/types'
import {
  type ERC20Token,
  type ETHToken,
  type EthereumCryptoProperNameLowercase,
  type ERC20ProperNameLowercase,
} from 'src/modules/crypto/ethereum/types'
import { type CryptoSymbol } from 'src/modules/crypto/types'

import { type WithdrawalPluginType, type Plugin } from '../../types'
import { Ethereum } from './ethereum'
import { Litecoin } from './litecoin'
import { Bitcoin } from './bitcoin'
import { Tether } from './tether'
import { USDC } from './usdc'
import { Ripple } from './ripple'
import { Dogecoin } from './dogecoin'
import { Tron } from './tron'

/** @deprecated */
export const erc20WithdrawalPluginTokenMap: Record<
  ERC20ProperNameLowercase,
  ERC20Token
> = {
  tether: 'usdt',
  usdc: 'usdc',
}

/** @deprecated */
export const ethWithdrawalPluginTokenMap: Record<
  EthereumCryptoProperNameLowercase,
  ETHToken
> = {
  ethereum: 'eth',
  ...erc20WithdrawalPluginTokenMap,
}

export const PluginMap: Readonly<Record<WithdrawalPluginType, BalanceType>> = {
  bitcoin: 'crypto',
  litecoin: 'ltc',
  ethereum: 'eth',
  tether: 'usdt',
  usdc: 'usdc',
  ripple: 'xrp',
  dogecoin: 'doge',
  tron: 'trx',
}

const plugins: Record<WithdrawalPluginType, Plugin> = {
  bitcoin: Bitcoin,
  litecoin: Litecoin,
  ethereum: Ethereum,
  tether: Tether,
  usdc: USDC,
  ripple: Ripple,
  dogecoin: Dogecoin,
  tron: Tron,
}

export const CryptoPluginToCurrencyMap: Readonly<
  Record<WithdrawalPluginType, CryptoSymbol>
> = {
  bitcoin: 'btc',
  litecoin: 'ltc',
  ...ethWithdrawalPluginTokenMap,
  ripple: 'xrp',
  dogecoin: 'doge',
  tron: 'trx',
}

/** PaymentIQ is not a plugin */
export const PluginToCurrencyMap: Readonly<
  Record<WithdrawalPluginType | 'paymentIq', Currency>
> = {
  ...CryptoPluginToCurrencyMap,
  paymentIq: 'usd',
}

export function getPlugin(name: WithdrawalPluginType): Types.Plugin {
  const plugin = plugins[name]
  if (!plugin) {
    throw new APIValidationError('invalid_input')
  }
  return plugin
}
