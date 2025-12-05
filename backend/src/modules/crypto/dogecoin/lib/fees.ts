import { config } from 'src/system'
import { dogecoinBlockioApi } from 'src/vendors/blockio'

import { convertDogecoinToUserBalance } from './wallet'
import { type CryptoToken } from '../../types'

const { maxFeeUSD } = config.dogecoin

const adjustFee = (fee: number) => Math.min(fee, maxFeeUSD)

async function estimateDogecoinFee(amount = 1) {
  const testDogecoinAddress = config.isProd
    ? 'DTqm2UCi6AS1nSCo9jZ8AejZ3k1ZcF8qix'
    : 'nro6ePSzjsiCF8JEG4xtroQamy2ofEZyZi'

  const priority = 'high'
  const estimatedNetworkFee = await dogecoinBlockioApi.getNetworkFeeEstimate({
    amounts: `${amount}`,
    priority,
    to_addresses: testDogecoinAddress,
  })

  const fee = await convertDogecoinToUserBalance(
    parseFloat(estimatedNetworkFee),
  )

  return {
    fee: adjustFee(fee),
  }
}

export async function getDogecoinFee(token: CryptoToken = 'doge') {
  return await estimateDogecoinFee()
}
