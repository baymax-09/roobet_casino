import * as t from 'io-ts'

import { config } from 'src/system'
import { scopedLogger } from 'src/system/logger'
import { BasicCache } from 'src/util/redisModels'

import { convertTrxToUserBalance } from 'src/modules/crypto/tron/lib/wallet'
import { getProvider } from 'src/modules/crypto/tron/util/getProvider'

import { derivePrimaryWallet } from './wallet'
import {
  type TRC20Token,
  TRC20TokenAddress,
  isTRC20Token,
  isTronToken,
} from '../types'
import { type CryptoToken } from '../../types'

const ChainParameterV = t.array(
  t.type({
    key: t.string,
    value: t.number,
  }),
)

const TronFeeV = t.type({
  sun: t.number,
  trx: t.number,
  usd: t.number,
  bandwidth: t.number,
})

const TRC20FeeV = t.type({
  trx: t.number,
  usd: t.number,
  energy: t.number,
})

export type ChainParameter = t.TypeOf<typeof ChainParameterV>
export type TronFee = t.TypeOf<typeof TronFeeV>
type TRC20Fee = t.TypeOf<typeof TRC20FeeV>

const tronFeeLogger = scopedLogger('TronUserFeePaid')

const {
  processName,
  keyName,
  expires,
  minThresholdTrx,
  convertProcessName,
  convertkeyName,
} = config.tron.fee

export async function estimateTronEnergy(token: TRC20Token): Promise<TRC20Fee> {
  try {
    const tronWeb = getProvider()
    const contractAddr = TRC20TokenAddress[token]
    const functionSelector = 'transfer(address,uint256)'
    const issuerAddress = derivePrimaryWallet().address // this address must have usdt and usdc as its asset.
    const parameter = [
      { type: 'address', value: issuerAddress },
      { type: 'uint256', value: 1 },
    ]
    const { energy_required } = await tronWeb.transactionBuilder.estimateEnergy(
      contractAddr,
      functionSelector,
      {},
      parameter,
      issuerAddress,
    )

    // "energy_required" is in units of Energy
    // we use the standard burn conversion rate to get this in TRX units
    const trx = energy_required * config.tron.fee.energyToTRXRate
    const usd = await convertTrxToUserBalance(trx)
    return { energy: energy_required, trx, usd }
  } catch (error) {
    tronFeeLogger('Estimate Energy', { userId: null }).error(
      'Failed to Estimate TRC-20 Energy',
      {},
      error,
    )
    throw new Error('Failed to Estimate TRC-20 Energy')
  }
}

export async function estimateTronBandwidth(
  skipCache = false,
): Promise<TronFee> {
  if (!skipCache) {
    const fee: TronFee | null = await BasicCache.get(processName, keyName)
    if (fee) {
      return fee
    }
  }

  return await setTronFee()
}

async function setTronFee(): Promise<TronFee> {
  try {
    const MAX_RESULT_SIZE = 64
    const SIGNATURE_SIZE = 67
    const PROTOBUF_EXTRA_SIZE = 3

    const tronWeb = getProvider()
    const data: ChainParameter = await tronWeb.trx.getChainParameters()
    const bandwidthPrice = data.filter(
      item => item.key === 'getTransactionFee',
    )[0].value

    const to = 'TE8wNJGMRaKEXjrfeKCbzk4FFdawqRqSYL'
    const from = 'TYCEnGRdJ9hprauKEgVprv4Due8gV7LNAX'
    const tx = await tronWeb.transactionBuilder.sendTrx(to, 1, from, 0)
    const txSize =
      MAX_RESULT_SIZE +
      SIGNATURE_SIZE +
      PROTOBUF_EXTRA_SIZE +
      tx.raw_data_hex.length / 2

    const sun = txSize * bandwidthPrice
    const trx = parseFloat(tronWeb.fromSun(txSize * bandwidthPrice))
    const usd = await convertTrxToUserBalance(trx)
    const estimateFee = { sun, trx, usd, bandwidth: bandwidthPrice }

    await BasicCache.set(processName, keyName, estimateFee, expires)

    return estimateFee
  } catch (error) {
    tronFeeLogger('Estimate BandWidth', { userId: null }).error(
      'Failed to Estimate TRX BandWidth',
      {},
      error,
    )
    throw new Error('Failed to Estimate Tron BandWidth')
  }
}

export async function modifyUserFee(
  tronFee: TronFee | TRC20Fee,
): Promise<Omit<TronFee, 'bandwidth'>> {
  let usd: number | null = await BasicCache.get(
    convertProcessName,
    convertkeyName,
  )
  if (!usd) {
    usd = await convertTrxToUserBalance(minThresholdTrx)
    await BasicCache.set(convertProcessName, convertkeyName, usd, expires)
  }

  return {
    trx: tronFee.trx + minThresholdTrx,
    usd: tronFee.usd + usd,
    sun: tronFee.trx + minThresholdTrx * 1000000,
  }
}

export async function getTronFee(token: CryptoToken = 'trx') {
  if (!isTronToken(token)) {
    return { fee: 0 }
  }

  if (isTRC20Token(token)) {
    const estimateFee = await estimateTronEnergy(token)
    const fee = (await modifyUserFee(estimateFee)).usd
    return { fee }
  } else {
    const estimateFee = await estimateTronBandwidth()
    const fee = (await modifyUserFee(estimateFee)).usd
    return { fee }
  }
}
