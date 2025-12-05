import { type Types as UserTypes } from 'src/modules/user'
import {
  CryptoLowercaseList,
  type CryptoLowercase,
  isValidLowercaseCrypto,
  type CryptoNetwork,
} from 'src/modules/crypto/types'

import {
  type WithdrawStatusEnum,
  type WithdrawalRequest,
  type CryptoWithdrawal,
} from './Withdrawal'

export const WithdrawalPluginTypes = CryptoLowercaseList
export type WithdrawalPluginType = CryptoLowercase
export const isWithdrawalPluginType = isValidLowercaseCrypto

export interface PluginSendRequest extends WithdrawalRequest {
  id: string
}

export interface PluginSendResponse {
  externalId?: string
  status: WithdrawStatusEnum
}

export interface Plugin {
  validate: (
    user: UserTypes.User,
    withdrawal: WithdrawalRequest,
    network: CryptoNetwork,
  ) => Promise<WithdrawalRequest>
  sendBackground: (
    user: UserTypes.User,
    withdrawal: CryptoWithdrawal,
    network: CryptoNetwork,
  ) => Promise<string | null>
  send: (
    user: UserTypes.User,
    withdrawal: PluginSendRequest,
  ) => Promise<PluginSendResponse>
}

// TODO this is temporary and will be removed when TRC20 tokens are released
export const PluginToCryptoNetwork: Record<
  WithdrawalPluginType,
  CryptoNetwork
> = {
  bitcoin: 'Bitcoin',
  litecoin: 'Litecoin',
  dogecoin: 'Dogecoin',
  ethereum: 'Ethereum',
  tron: 'Tron',
  ripple: 'Ripple',
  tether: 'Ethereum',
  usdc: 'Ethereum',
}
