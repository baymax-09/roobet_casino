import { config } from 'src/system'
import { runJob, runWorker } from 'src/util/workerRunner'
import {
  getCurrencyPairsForSource,
  getCurrencyPairsForTarget,
} from 'src/modules/currency/documents/exchange_rates'
import { scopedLogger } from 'src/system/logger'
import { sleep } from 'src/util/helpers/timer'

import { updateCryptoExchangeRates } from '../lib/exchangeRates/crypto'
import { updateFiatExchangeRates } from '../lib/exchangeRates/fiat'
import { type CashCurrency } from '../types'

const currencyLogger = scopedLogger('currency')('exchangeRates', {
  userId: null,
})

const targetUSD = 'usd' as const satisfies CashCurrency

/** We are rate limited by third party APIs -- update these timers with caution */
const timer = 1000 * 60 * 10 // 10 minutes

export async function run() {
  if (config.oneshot) {
    runJob('exchangeRates', startJob)
  } else {
    runWorker('exchangeRates', start)
  }
}

async function start(): Promise<void> {
  while (true) {
    await startJob()
    await sleep(timer)
  }
}

async function startJob(forceRun: boolean = false): Promise<void> {
  if (config.isProd || config.isStaging || forceRun) {
    try {
      await handleCryptoExchangeRates()
    } catch (error) {
      currencyLogger.alert('exchangeRatesWorker', { which: 'crypto' }, error)
    }
    try {
      await handleFiatExchangeRates()
    } catch (error) {
      currencyLogger.alert('exchangeRatesWorker', { which: 'fiat' }, error)
    }
  }
}

async function handleCryptoExchangeRates() {
  const currencyPairs = await getCurrencyPairsForTarget(targetUSD)
  const args = {
    currencyPairs,
    mainCurrency: targetUSD,
  }
  await updateCryptoExchangeRates(args)
}

async function handleFiatExchangeRates() {
  const currencyPairs = await getCurrencyPairsForSource(targetUSD)
  const args = {
    currencyPairs,
    mainCurrency: targetUSD,
  }

  await updateFiatExchangeRates(args)
}

export const forceRunUpdateExchangeRates = async () => {
  await startJob(true)
}
