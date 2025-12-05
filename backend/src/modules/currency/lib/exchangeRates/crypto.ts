import CoinMarketCap from 'coinmarketcap-api'

import { config } from 'src/system'
import { updateCurrencyPair } from 'src/modules/currency/documents/exchange_rates'
import { scopedLogger } from 'src/system/logger'

import { type CryptoSymbol } from 'src/modules/crypto/types'
import {
  isValidSymbol,
  relativeChange,
  CryptoExchangeList,
  type ExchangeRatesArgs,
} from './util'

interface CryptoExchangeRateArgs extends ExchangeRatesArgs {
  coin: Awaited<ReturnType<CoinMarketCap['getTickers']>>['data'][number]
}

const currencyLogger = scopedLogger('currency')
const client = new CoinMarketCap(config.coinmarketCap.key)

const updateCryptoExchangeRate = async ({
  coin,
  mainCurrency: target,
  currencyPairs,
}: CryptoExchangeRateArgs) => {
  const symbol = coin.symbol.toLowerCase()
  if (!isValidSymbol<CryptoSymbol>(CryptoExchangeList, symbol)) {
    return
  }

  const logger = currencyLogger('updateCryptoExchangeRates', { userId: null })
  const { price } = coin.quote.USD
  const current = currencyPairs.find(pair => pair.sourceCurrency === symbol)
  const averageRate = current?.exchangeRate || 0.0
  const change = relativeChange(averageRate, price)
  const isNormalChange = change < 0.5

  if (isNormalChange || !current) {
    await updateCurrencyPair(symbol, target, price)
    logger.info(
      `Crypto exchange rate relative change: ${symbol} ${change}x, ${current?.sourceCurrency} -> ${price}`,
    )
  } else {
    logger.alert('cryptoExchangeRateAnomaly', {
      targetCurrency: symbol,
      change,
      sourceCurrency: current.sourceCurrency,
      newRate: price,
      previousRate: averageRate,
    })
  }
}

export async function updateCryptoExchangeRates({
  currencyPairs,
  mainCurrency: target,
}: ExchangeRatesArgs) {
  /**
   * CoinMarketCap
   * Cryptocurrencies will always have a targetCurrency to USD.
   */
  const data = await client.getTickers()
  if (!data) {
    return
  }

  const coins = data.data.filter(coin =>
    isValidSymbol<CryptoSymbol>(CryptoExchangeList, coin.symbol.toLowerCase()),
  )
  for (const coin of coins) {
    await updateCryptoExchangeRate({
      currencyPairs,
      mainCurrency: target,
      coin,
    })
  }

  /**
   * Coinbase
   * Here just in case, test before using extensively.
   */
  // async function updateCryptoExchangeRates() {
  //   if (true || config.mode == 'prod') {
  //     try {
  //       const cryptoRates = {}
  //       const prices = await request({
  //         uri: 'https://api.coinbase.com/v2/prices/USD/spot?currency=USD',
  //         json: true,
  //       })

  //       for (const price of prices.data) {
  //         if (['BTC', 'ETH', 'LTC'].includes(price.base)) {
  //           cryptoRates[price.base.toLowerCase()] = parseFloat(price.amount)
  //         }
  //       }
  //       await updateExchangeRates({ cryptoPrices: cryptoRates })
  //     } catch (err) {
  //       winston.error('Error updating exchange rates.', err)
  //     }
  //   } else {
  //     winston.info("Not running exchange worker, we're in dev.")
  //   }
  // }
}
