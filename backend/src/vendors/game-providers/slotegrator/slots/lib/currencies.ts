import { config } from 'src/system'
import {
  isDisplayCurrency,
  type DisplayCurrency,
} from 'src/modules/user/types/DisplayCurrency'
import { type SlotegratorSlotsProvidersInternal } from './providers'
import { checkEnvironmentLimits } from './api'
import { currencyCodeToDisplayCurrency } from '../../common'
import { scopedLogger } from 'src/system/logger'

const slotegratorCurrencyLogger = scopedLogger('slotegratorSlots-currency')

export const SLOTEGRATOR_SLOTS_DEFAULT_CURRENCY = (
  config.isLocal ? 'eur' : 'usd'
) as DisplayCurrency

export const checkCurrencySupportByProvider = async (
  provider: SlotegratorSlotsProvidersInternal,
): Promise<DisplayCurrency[]> => {
  const logger = slotegratorCurrencyLogger('CurrencySupportByProvider', {
    userId: null,
  })
  const supportedCurrencies: DisplayCurrency[] = []
  const slotegratorLimits = await checkEnvironmentLimits()

  slotegratorLimits.map(limit => {
    if (limit.providers.includes(provider)) {
      const limitDisplayCurrency = currencyCodeToDisplayCurrency(limit.currency)
      if (isDisplayCurrency(limitDisplayCurrency)) {
        supportedCurrencies.push(limitDisplayCurrency)
      }
    }
    return null
  })
  logger.debug(`[${provider}]:supportedCurrencies `, supportedCurrencies)
  return supportedCurrencies
}
