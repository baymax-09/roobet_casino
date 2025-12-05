import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type Currency } from '../types'

export interface CryptoPrices {
  btc: number
  eth: number
  ltc: number
  usdt: number
  usdc: number
  xrp: number
  doge: number
}

export interface CurrencyPair<
  S extends Currency = Currency,
  T extends Currency = Currency,
> {
  /** The exchange rate is always recorded as the ratio of the sourceCurrency/targetCurrency -- ex: USD/CAD
   * AKA the amount of the sourceCurrency which is equal to 1 of the targetCurrency
   */
  exchangeRate: number
  /** Together, a source currency and target currency make up a Currency Pair */
  sourceCurrency: S
  targetCurrency: T

  createdAt?: Date
  updatedAt?: Date
}

const ExchangeRateSchema = new mongoose.Schema<CurrencyPair>(
  {
    sourceCurrency: {
      type: String,
      required: true,
      index: true,
    },
    targetCurrency: {
      type: String,
      required: true,
      index: true,
    },
    exchangeRate: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
)

ExchangeRateSchema.index(
  { sourceCurrency: 1, targetCurrency: 1 },
  { unique: true },
)

const ExchangeRates = mongoose.model<CurrencyPair>(
  'exchange_rates',
  ExchangeRateSchema,
)

export async function updateCurrencyPair(
  sourceCurrency: Currency,
  targetCurrency: Currency,
  exchangeRate: number,
): Promise<CurrencyPair | null> {
  return await ExchangeRates.findOneAndUpdate(
    {
      sourceCurrency,
      targetCurrency,
    },
    {
      sourceCurrency,
      targetCurrency,
      exchangeRate,
    },
    {
      upsert: true,
      new: true,
    },
  ).lean()
}

export async function getCurrencyPairsForTarget(
  targetCurrency: Currency,
): Promise<CurrencyPair[]> {
  return await ExchangeRates.find({ targetCurrency }).lean()
}

export async function getCurrencyPairsForSource(
  sourceCurrency: Currency,
): Promise<CurrencyPair[]> {
  return await ExchangeRates.find({ sourceCurrency }).lean()
}

export async function getCurrencyPair(
  sourceCurrency: Currency,
  targetCurrency: Currency,
): Promise<CurrencyPair | null> {
  return await ExchangeRates.findOne({ sourceCurrency, targetCurrency }).lean()
}

export async function getCurrencyPairs<T extends Currency, S extends Currency>(
  targetCurrencies: readonly T[],
  sourceCurrency: S,
): Promise<Array<CurrencyPair<T, S>>> {
  return await ExchangeRates.find({
    targetCurrency: { $in: targetCurrencies },
    sourceCurrency,
  }).lean()
}

export async function getCurrencyPairsBySource<
  T extends Currency,
  S extends Currency,
>(
  sourceCurrencies: readonly T[],
  targetCurrency: S,
): Promise<Array<CurrencyPair<T, S>>> {
  return await ExchangeRates.find({
    sourceCurrency: { $in: sourceCurrencies },
    targetCurrency,
  }).lean()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: ExchangeRates.collection.name,
}
