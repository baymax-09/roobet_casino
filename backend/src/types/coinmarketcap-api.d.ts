declare module 'coinmarketcap-api' {
  class CoinMarketCap {
    constructor(apiKey: string)

    getTickers(): Promise<{
      data: Array<{
        symbol: Uppercase<string>
        quote: {
          USD: {
            price: number
          }
        }
      }>
    }>
  }

  export = CoinMarketCap
}
