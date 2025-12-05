import { config } from 'src/system'
import { sleep } from 'src/util/helpers/timer'
import { scopedLogger } from 'src/system/logger'
import { runWorker } from 'src/util/workerRunner'
import {
  BlockioCryptoSymbolList,
  type BlockioCryptoSymbol,
} from 'src/modules/crypto/types'

import { type BlockioApi, useBlockioApi } from '../lib/api'

const blockIOLogger = scopedLogger('poolBlockIoDeposits')

export async function run() {
  if (config.isProd || config.isStaging) {
    await runWorker('poolBlockIoDeposits', start)
  }
}

const defaultAddresses = {
  ltc: config.litecoin.poolingAddress,
  btc: config.bitcoin.poolingAddress,
  doge: config.dogecoin.poolingAddress,
} as const

async function start() {
  const logger = blockIOLogger('start', { userId: null })

  while (true) {
    // pool deposits for each crypto
    const tasks = BlockioCryptoSymbolList.map(async crypto => {
      try {
        const blockioApi = useBlockioApi(crypto)
        await poolDeposits(crypto, blockioApi)
      } catch (error) {
        logger.error(`Failed to pool deposits for ${crypto}`, { crypto }, error)
      }
    })

    // process all crypto pooling in parallel
    await Promise.all(tasks)
    await sleep(1000 * 60 * 60)
  }
}

async function poolDeposits(
  crypto: BlockioCryptoSymbol,
  blockioApi: BlockioApi,
) {
  let accountBalance, defaultAddressBalance
  do {
    accountBalance = await blockioApi.getBalance(false)
    defaultAddressBalance = await blockioApi.getBalanceForAddress(
      defaultAddresses[crypto],
    )
    await attemptToSendToDefaultWallet(
      crypto,
      blockioApi,
      accountBalance - defaultAddressBalance,
    )
    await sleep(1000 * 30)
    // while default balance is less than 90% of the address balances keep pooling
  } while (defaultAddressBalance / accountBalance < 0.9)
}

async function attemptToSendToDefaultWallet(
  crypto: BlockioCryptoSymbol,
  blockIoApi: BlockioApi,
  amount: number,
): Promise<void> {
  const logger = blockIOLogger('attemptToSendToDefaultWallet', { userId: null })
  if (amount < 0.2) {
    return
  }

  const amountToSend = (amount * 0.98).toFixed(8)
  try {
    // subtract crypto fees
    const estimatedNetworkFee = await blockIoApi.getNetworkFeeEstimate({
      amounts: `${amountToSend}`,
      priority: 'high',
      to_addresses: `${defaultAddresses[crypto]}`,
    })
    const customFee = (parseFloat(estimatedNetworkFee) * 1.35).toFixed(8)
    await blockIoApi.withdraw({
      to_addresses: defaultAddresses[crypto],
      amounts: amountToSend,
      priority: 'custom',
      custom_network_fee: `${customFee}`,
    })
  } catch (error) {
    logger.error(
      `Failed to send ${amountToSend} of ${crypto} to default wallet. Attempting to send ${
        amount / 2.0
      }`,
      { amountToSend, amount, crypto },
      error,
    )
    await attemptToSendToDefaultWallet(crypto, blockIoApi, amount / 2.0)
  }
}
