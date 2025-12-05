import axios from 'axios'

import { config } from 'src/system'
import { scopedLogger } from 'src/system/logger'
import { type CashCurrency } from 'src/modules/currency/types'

import {
  type FixerLiveRatesRequest,
  type FixerLiveRatesResponse,
} from '../types'

const fixerLogger = scopedLogger('fixer')('fetchLiveExchangeRates', {
  userId: null,
})

const apiKey = config.fixer.apiKey

const api = axios.create({
  baseURL: 'https://data.fixer.io/api',
})

interface FetchLiveRateArgs {
  /** comma separated string of currencies */
  targetCurrencies: string
  sourceCurrency: CashCurrency
}

export async function fetchLiveExchangeRates({
  sourceCurrency,
  targetCurrencies,
}: FetchLiveRateArgs): Promise<FixerLiveRatesResponse | undefined> {
  const params: FixerLiveRatesRequest = {
    symbols: targetCurrencies,
    base: sourceCurrency,
    access_key: apiKey,
  }

  try {
    const response = await api.get<FixerLiveRatesResponse>('/latest', {
      params,
    })

    if (!response?.data?.success) {
      throw 'No Response Returned'
    }

    return response.data
  } catch (error) {
    fixerLogger.alert('fixerApiError', {}, error)
  }
}
