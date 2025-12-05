import { type CashCurrency } from 'src/modules/currency/types'

export interface FixerLiveRatesRequest {
  base: CashCurrency
  /** comma separated value of currency symbols */
  symbols: string
  access_key: string
}
