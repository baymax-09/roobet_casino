import gql from 'graphql-tag'

export const ExchangeRatesQuery = gql`
  query ExchangeRates {
    exchangeRates {
      btc
      eth
      ltc
    }
  }
`
