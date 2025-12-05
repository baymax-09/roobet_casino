import { convertBitcoinToUserBalance } from 'src/modules/crypto/bitcoin'
import { convertEtherToUserBalance } from 'src/modules/crypto/ethereum'
import { convertLitecoinToUserBalance } from 'src/modules/crypto/litecoin/lib'
import { convertCurrencyToUserBalance } from 'src/modules/currency'
import { convertXrpToUserBalance } from 'src/modules/crypto/ripple/lib'
import { convertDogecoinToUserBalance } from 'src/modules/crypto/dogecoin'
import { convertTrxToUserBalance } from 'src/modules/crypto/tron/lib'
import { type CryptoDepositType } from 'src/modules/deposit/types'

import { type BlockioCryptoProperName, type Crypto } from '../types'

export { generateNonce } from './nonce'
export { addCryptoDeposit } from './deposit'
export { getBlockByBlockHash } from './blockexplorer'

export const cryptoConversionMap: Readonly<
  Record<Crypto, (amount: number) => Promise<number>>
> = {
  Bitcoin: convertBitcoinToUserBalance,
  Ethereum: convertEtherToUserBalance,
  Litecoin: convertLitecoinToUserBalance,
  Tether: async (amount: number) =>
    await convertCurrencyToUserBalance(amount, 'usdt'),
  USDC: async (amount: number) =>
    await convertCurrencyToUserBalance(amount, 'usdc'),
  Ripple: convertXrpToUserBalance,
  Dogecoin: convertDogecoinToUserBalance,
  Tron: convertTrxToUserBalance,
}

export const getCryptoUrl = (crypto: CryptoDepositType, txId: string) => {
  const urlMap: Record<CryptoDepositType, string> = {
    bitcoin: 'https://www.blockchain.com/btc/tx',
    ethereum: 'https://etherscan.io/tx',
    litecoin: 'https://live.blockcypher.com/ltc/tx',
    tether: 'https://etherscan.io/tx',
    usdc: 'https://etherscan.io/tx',
    ripple: 'https://xrpscan.com/tx',
    dogecoin: 'https://dogechain.info/tx',
    tron: 'https://tronscan.org/#/blockchain/transactions',
  }
  return `${urlMap[crypto]}/${txId}`
}

const bitcoinRedisKey = 'latestBitcoinBlockhash'
const litecoinRedisKey = 'latestLitecoinBlockhash'
const dogecoinRedisKey = 'latestDogecoinBlockhash'
export const depositProcessName = 'blockioDeposits'

export const depositRedisKeys: Readonly<
  Record<BlockioCryptoProperName, string>
> = {
  Bitcoin: bitcoinRedisKey,
  Litecoin: litecoinRedisKey,
  Dogecoin: dogecoinRedisKey,
}
