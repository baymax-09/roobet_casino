import { enumType, objectType } from 'nexus'

import { config } from 'src/system'

export const DisplayCurrencyEnumType = enumType({
  name: 'DisplayCurrency',
  description: 'Enum of supported display currencies.',
  members: config.displayCurrencies,
})

export const CurrencySettingsType = objectType({
  name: 'CurrencySettings',
  definition(type) {
    type.nonNull.field('displayCurrency', {
      auth: null,
      description: 'The displayed currency.',
      type: DisplayCurrencyEnumType,
    })
    type.nonNull.boolean('hideEmptyBalances')
  },
})
