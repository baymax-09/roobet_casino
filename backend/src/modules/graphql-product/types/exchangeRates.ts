import { objectType } from 'nexus'
import path from 'path'

export const ExchangeRatesType = objectType({
  name: 'ExchangeRates',
  description: 'The list of current crypto prices in USD',
  sourceType: {
    module: path.resolve(__dirname),
    export: 'DBCryptoPrices',
  },
  definition(type) {
    type.nonNull.string('btc')
    type.nonNull.string('eth')
    type.nonNull.string('ltc')
    type.nonNull.string('doge')
  },
})
