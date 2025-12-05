import { config } from 'src/system'

export type DisplayCurrency = (typeof config.displayCurrencies)[number]
export const isDisplayCurrency = (value: any): value is DisplayCurrency =>
  config.displayCurrencies.includes(value)
