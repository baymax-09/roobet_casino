import { config } from 'src/system'
import { litecoinBlockioApi } from 'src/vendors/blockio'

import { convertLitecoinToUserBalance } from './lib'
import { type CryptoToken } from '../types'

const { maxFeeUSD } = config.litecoin

const adjustFee = (fee: number) => Math.min(fee, maxFeeUSD)

async function estimateLitecoinFee(amount = 1) {
  const testLitecoinAddress = config.isProd
    ? '3FevEHskXX9tpp2Apk8ynRL1YR3CSZsPZw'
    : 'QRk1wPJaSZU6bw7n8qtqbAptfhECTcBDwb'

  const priority = 'high'
  const estimatedNetworkFee = await litecoinBlockioApi.getNetworkFeeEstimate({
    amounts: `${amount}`,
    priority,
    to_addresses: testLitecoinAddress,
  })
  const fee = await convertLitecoinToUserBalance(
    parseFloat(estimatedNetworkFee),
  )

  return {
    fee: adjustFee(fee),
  }
}

export async function getLitecoinFee(token: CryptoToken = 'ltc') {
  return await estimateLitecoinFee()
}

export * as Documents from './documents'
