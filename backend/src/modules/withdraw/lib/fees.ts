import { getEthereumFee } from 'src/modules/crypto/ethereum'
import { getLitecoinFee } from 'src/modules/crypto/litecoin'
import { getBitcoinFee } from 'src/modules/crypto/bitcoin'
import { getDogecoinFee } from 'src/modules/crypto/dogecoin'
import { getTronFee } from 'src/modules/crypto/tron/lib'
import { BasicCache } from 'src/util/redisModels'
import {
  isCryptoSymbol,
  isCryptoNetworkLowercase,
  type CryptoToken,
  type CryptoNetworkLowercase,
  type CryptoSymbol,
} from 'src/modules/crypto/types'

type FeeNetworkType = CryptoNetworkLowercase
export const isFeeNetworkType = isCryptoNetworkLowercase
type NetworkFeeValueType = Record<FeeNetworkType, Record<CryptoToken, number>>

export const WITHDRAW_FEE_CACHE_KEY = 'short'

const WITHDRAW_FEE_CACHE_EXP_MAP = {
  bitcoin: {
    btc: 60 * 5,
  },
  litecoin: {
    ltc: 60 * 5,
  },
  ethereum: {
    eth: 30,
    usdt: 30,
    usdc: 30,
  },
  ripple: {
    xrp: 30,
  },
  dogecoin: {
    doge: 60 * 5,
  },
  tron: {
    trx: 30,
    usdt: 30,
    usdc: 30,
  },
} as const

const WITHDRAW_FEE_MAP = {
  bitcoin: getBitcoinFee,
  ethereum: getEthereumFee,
  litecoin: getLitecoinFee,
  ripple: async (token: CryptoToken = 'xrp') => {
    return { fee: 0 }
  },
  dogecoin: getDogecoinFee,
  tron: getTronFee,
} as const

export const getFeeCacheName = (
  network: FeeNetworkType,
  crypto: CryptoSymbol,
) => {
  return `${network}/${crypto}/fee`
}

export const getEstimatedWithdrawFee = async (
  network: FeeNetworkType,
  crypto: CryptoSymbol,
) => {
  if (!(isFeeNetworkType(network) && isCryptoSymbol(crypto))) {
    throw new Error(
      `Failed to get estimated fee for unsupported network or crypto type "${network}", ${crypto}".`,
    )
  }

  const name = getFeeCacheName(network, crypto)
  const expiry = (WITHDRAW_FEE_CACHE_EXP_MAP as NetworkFeeValueType)[network][
    crypto
  ]
  const query = async () => await WITHDRAW_FEE_MAP[network](crypto)
  return await BasicCache.cached(name, WITHDRAW_FEE_CACHE_KEY, expiry, query)
}

export const updateEstimatedFeeCache = async (
  network: FeeNetworkType,
  crypto: CryptoSymbol,
) => {
  if (!(isFeeNetworkType(network) && isCryptoSymbol(crypto))) {
    throw new Error(
      `Failed to update estimated fee cache for unsupported network or crypto type "${network}", ${crypto}".`,
    )
  }

  const name = getFeeCacheName(network, crypto)
  const value = await WITHDRAW_FEE_MAP[network](crypto)

  const expiry = (WITHDRAW_FEE_CACHE_EXP_MAP as NetworkFeeValueType)[network][
    crypto
  ]

  await BasicCache.set(name, WITHDRAW_FEE_CACHE_KEY, value, expiry)
}
