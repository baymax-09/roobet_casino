import Web3 from 'web3'

import { config } from 'src/system'
import { setGlobalStat } from 'src/modules/siteSettings'
import { runOnInterval, runWorker } from 'src/util/workerRunner'
import { Timeseries, ValueCache } from 'src/util/redisModels'
import { slackBalances } from 'src/vendors/slack'
import {
  incrementAllTimeNumBets,
  incrementAllTimeTotalBet,
} from 'src/modules/siteSettings/documents/settings'
import { derivePrimaryEthWalletAddress } from 'src/modules/crypto/ethereum'
import { convertSourceCurrenciesToUSD } from 'src/modules/currency'
import { exists } from 'src/util/helpers/types'
import { CryptoBalanceTypes } from 'src/modules/user/balance'

import { safelyRecordBalancesHistory } from '../documents/balancesHistory'
import {
  type CryptoBalances,
  fetchBtcBalances,
  fetchDogeBalances,
  fetchErc20Balance,
  fetchEthBalances,
  fetchLtcBalances,
  fetchTrxBalances,
  fetchXrpBalances,
  type BalanceRepresentation,
} from '../lib/formatBalances'
import { analyticsLogger } from '../lib/logger'

// Cron intervals in seconds.
const LOG_BALANCES_INTERVAL_SECONDS = 20 * 60
const STORE_BALANCES_INTERVAL_SECONDS = 5 * 60
const STORE_GLOBAL_AMOUNTS_INTERVAL_SECONDS = 2
const UPDATE_INTERVAL_SECONDS = config.globalstatsworkers.sleepSeconds

const buildExchangeRates = async () => {
  const currencyPairs = await convertSourceCurrenciesToUSD([
    'btc',
    'eth',
    'ltc',
    'usdt',
    'usdc',
    'xrp',
    'doge',
  ])

  return currencyPairs.map(pair => ({
    [pair.sourceCurrency]: pair.exchangeRate,
  }))
}

function buildSlackMessage(
  startingText: string,
  cryptoAmount: number,
  convertedAmountInFiat: number,
) {
  return `${startingText}: ${cryptoAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} (${convertedAmountInFiat.toLocaleString('en-us', {
    style: 'currency',
    currency: 'USD',
  })})`
}

const fetchCryptoBalances = async (): Promise<CryptoBalances> => {
  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)
  const mainAddress = await derivePrimaryEthWalletAddress()
  const createBatch = () => new web3.BatchRequest()

  const exchangeRates = await buildExchangeRates()
  const getRate = (token: string) => {
    const rateObj = exchangeRates.find(rate => token in rate)
    return rateObj ? rateObj[token] : 0
  }

  return {
    crypto: await fetchBtcBalances(getRate('btc')),
    ltc: await fetchLtcBalances(getRate('ltc')),
    doge: await fetchDogeBalances(getRate('doge')),
    trx: await fetchTrxBalances(),
    xrp: await fetchXrpBalances(),
    eth: await fetchEthBalances(getRate('eth'), createBatch, mainAddress, web3),
    usdc: await fetchErc20Balance('usdc', getRate, createBatch, mainAddress),
    usdt: await fetchErc20Balance('usdt', getRate, createBatch, mainAddress),
  }
}

const formatTokenName = (token: string): string => {
  const transformed = (() => {
    if (token === 'crypto') {
      return 'btc'
    }

    return token
  })()

  return transformed.toUpperCase()
}

const formatConfirmed = (
  readableToken: string,
  balance: BalanceRepresentation,
) =>
  buildSlackMessage(
    `${readableToken} Balance (confirmed)`,
    balance.confirmed.tokens,
    balance.confirmed.usd,
  )

const formatPending = (
  readableToken: string,
  balance: BalanceRepresentation,
) => {
  if (balance.pending && balance.pending.tokens > 0) {
    return buildSlackMessage(
      `${readableToken} Balance (pending)`,
      balance.pending.tokens,
      balance.pending.usd || 0,
    )
  }
}

const formatCostToPool = (
  readableToken: string,
  balance: BalanceRepresentation,
) => {
  if (balance.poolingFees && balance.poolingFees.tokens > 0) {
    return buildSlackMessage(
      `${readableToken} Cost To Pool`,
      balance.poolingFees.tokens,
      balance.poolingFees.usd,
    )
  }
}

const alertLowBalances = (balances: CryptoBalances) => {
  for (const key of CryptoBalanceTypes) {
    const token = balances[key]

    // If no data is available, we failed to fetch and should not report.
    if (!token) {
      continue
    }

    if (
      token.confirmed.usd + (token.pending?.usd ?? 0) <
      config.lowHotWalletBalanceThresholds[key]
    ) {
      analyticsLogger('alertLowBalance', { userId: null }).warn(
        'Low Hot Wallet Balance',
        { monitorKey: 'lowHotWalletBalance', token },
      )
    }
  }
}

async function logBalances() {
  await runOnInterval(LOG_BALANCES_INTERVAL_SECONDS, async () => {
    const logger = analyticsLogger('logBalances', { userId: null })
    try {
      const balances = await fetchCryptoBalances()

      alertLowBalances(balances)

      // Send the Slack message with the same token order as one message.
      const message = Object.entries(balances)
        .sort(([tokenA], [tokenB]) => tokenA.localeCompare(tokenB))
        .flatMap(([token, balance]) => {
          const readableToken = formatTokenName(token)

          // If not data is available, do not report.
          if (!balance) {
            return []
          }

          return [
            formatConfirmed(readableToken, balance),
            formatPending(readableToken, balance),
            formatCostToPool(readableToken, balance),
          ].filter(exists)
        })
        .join('\n')

      slackBalances(message)
    } catch (error) {
      logger.error('failed to report balances to Slack', {}, error)
    }
  })
}

async function storeBalanceHistory() {
  await runOnInterval(STORE_BALANCES_INTERVAL_SECONDS, async () => {
    const logger = analyticsLogger('storeBalanceHistory', { userId: null })

    try {
      const balances = await fetchCryptoBalances()

      await safelyRecordBalancesHistory(balances)
    } catch (error) {
      logger.error('failed to record balances', {}, error)
    }
  })
}

async function setGlobalAmountWon(): Promise<void> {
  let globalAmountWon24: number | undefined
  const logger = analyticsLogger('setGlobalAmountWon', { userId: null })

  await runOnInterval(STORE_GLOBAL_AMOUNTS_INTERVAL_SECONDS, async () => {
    try {
      const newAmountWon24 = await Timeseries.getTimeseriesSummation(
        'globalAmountWon',
        '1hour',
        24,
        true,
      )

      if (newAmountWon24 !== globalAmountWon24) {
        globalAmountWon24 = newAmountWon24
        await setGlobalStat('globalAmountWonPast24', newAmountWon24)
      }
    } catch (error) {
      logger.error('failed to set global amount won', {}, error)
    }
  })
}

async function setGlobalAmountBet(): Promise<void> {
  let globalAmountBet24: number | undefined
  const logger = analyticsLogger('setGlobalAmountBet', { userId: null })

  await runOnInterval(STORE_GLOBAL_AMOUNTS_INTERVAL_SECONDS, async () => {
    try {
      const newAmount = await Timeseries.getTimeseriesSummation(
        'globalAmountBet',
        '1hour',
        24,
        true,
      )

      if (newAmount !== globalAmountBet24) {
        globalAmountBet24 = newAmount
        await setGlobalStat('globalAmountBetPast24', newAmount)
      }
    } catch (error) {
      logger.error('failed to set global amount bet', {}, error)
    }
  })
}

async function recordAllTimeNumBets(): Promise<void> {
  const logger = analyticsLogger('recordAllTimeNumBets', { userId: null })

  await runOnInterval(UPDATE_INTERVAL_SECONDS, async () => {
    try {
      const allTimeNumBets = Number(
        await ValueCache.get('allTimeNumBets', 'allTimeNumBets'),
      )

      if (allTimeNumBets > 0) {
        await incrementAllTimeNumBets(allTimeNumBets)
        await ValueCache.decrBy(
          'allTimeNumBets',
          'allTimeNumBets',
          allTimeNumBets,
        )
      }
    } catch (error) {
      logger.error('failed to increment', {}, error)
    }
  })
}

async function recordAllTimeTotalBet(): Promise<void> {
  const logger = analyticsLogger('recordAllTimeTotalBet', { userId: null })

  await runOnInterval(UPDATE_INTERVAL_SECONDS, async () => {
    try {
      const allTimeTotalBet = Number(
        await ValueCache.get('allTimeTotalBet', 'allTimeTotalBet'),
      )

      if (allTimeTotalBet > 0) {
        await incrementAllTimeTotalBet(allTimeTotalBet)
        await ValueCache.incrByFloat(
          'allTimeTotalBet',
          'allTimeTotalBet',
          -allTimeTotalBet,
        )
      }
    } catch (error) {
      logger.error('failed to increment', {}, error)
    }
  })
}

async function startJob(): Promise<void> {
  if (config.isProd || config.isStaging) {
    await Promise.all([
      logBalances(), // needs a gETH node to reach out to, so won't work locally
      storeBalanceHistory(),
      setGlobalAmountWon(),
      setGlobalAmountBet(),
      recordAllTimeNumBets(),
      recordAllTimeTotalBet(),
    ])
  } else {
    await Promise.all([recordAllTimeNumBets(), recordAllTimeTotalBet()])
  }
}

export async function run() {
  runWorker('analytics', startJob)
}
