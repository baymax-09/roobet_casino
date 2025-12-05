import { type CashCurrency } from 'src/modules/currency/types'

type FixerRatesKey = Uppercase<CashCurrency>

export interface FixerLiveRatesResponse {
  rates: Record<FixerRatesKey, number>
  /** Source Currency - Should correspond to one of our Currency Types */
  base: string
  date: string
  success: boolean
  /** Unix timestamp */
  timestamp: number
}
