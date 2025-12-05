import { config } from 'src/system'
import { bitcoinBlockioApi } from 'src/vendors/blockio'

import { convertBitcoinToUserBalance } from './lib'
import { type CryptoToken } from '../types'

export { checkTxEligiblePrecredit } from './lib/precredit'
export {
  convertBitcoinToUserBalance,
  convertUserBalanceToBitcoin,
  satoshisToBitcoin,
  deriveBitcoinWalletAddress,
} from './lib'

const { maxFeeUSD } = config.bitcoin

const adjustFee = (fee: number) => Math.min(fee, maxFeeUSD)

async function estimateBitcoinFee(amount = 0.001) {
  const testToAddress = config.isProd
    ? 'bc1q9jm6dv89y02yz4nt40g8745230zrpu9m8exprn7c7xlqd7hn8w2qprvmfr'
    : '2N4MMP3BubfuTwMCNmJxy9H8wzsiqy1wCKj'

  const testFromAddress = config.isProd
    ? config.bitcoin.withdrawalAddress
    : 'tb1q2u5jjmuu2x7p7w4kclv0dytjnvlpu45sxg4hk7ph9dk87n8exwuszddlnk'

  const priority = 'high'
  const estimatedNetworkFee = await bitcoinBlockioApi.getNetworkFeeEstimate({
    amounts: `${amount}`,
    priority,
    to_addresses: testToAddress,
    from_addresses: testFromAddress,
  })
  const fee = await convertBitcoinToUserBalance(parseFloat(estimatedNetworkFee))

  return {
    fee: adjustFee(fee),
  }
}

export async function getBitcoinFee(token: CryptoToken = 'btc') {
  return estimateBitcoinFee()
}

export * as Documents from './documents'
