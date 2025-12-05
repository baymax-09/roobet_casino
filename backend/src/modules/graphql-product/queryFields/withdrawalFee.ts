import { nonNull, queryField, stringArg } from 'nexus'
import { GraphQLError } from 'graphql'

import {
  type CryptoNetworkLowercase,
  type CryptoSymbol,
  isCryptoSymbol,
} from 'src/modules/crypto/types'

import { WithdrawalFeeType } from '../types/withdrawalFee'
import { getEstimatedWithdrawFee } from 'src/modules/withdraw/lib/fees'

// Temp code for optional network
const CRYPTO_NETWORK_MAP = {
  btc: 'bitcoin',
  ltc: 'litecoin',
  doge: 'dogecoin',
  eth: 'ethereum',
  usdt: 'ethereum', // legacy frontend only supports usdt and usdc on ethereum
  usdc: 'ethereum', // legacy frontend only supports usdt and usdc on ethereum
  xrp: 'ripple',
  trx: 'tron',
}

export const WithdrawalFeeQueryField = queryField('withdrawalFee', {
  type: WithdrawalFeeType,
  description:
    'Fetches the current withdrawal fee for the given network and crypto.',
  auth: {
    authenticated: true,
  },
  args: { crypto: nonNull(stringArg()) },
  resolve: async (_, { crypto }) => {
    try {
      // TODO move this check into a scalar type.
      // Temp code for optional network
      const network = CRYPTO_NETWORK_MAP[crypto as CryptoSymbol]

      if (isCryptoSymbol(crypto)) {
        const { fee } = await getEstimatedWithdrawFee(
          network as CryptoNetworkLowercase,
          crypto,
        )
        return {
          id: `${network}/${crypto}`,
          fee,
        }
      }
      return null
    } catch (error) {
      throw new GraphQLError('unable_estimate_fee')
    }
  },
})
