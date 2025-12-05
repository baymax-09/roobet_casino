declare module 'wallet-address-validator' {
  /**
   * @param currencyNameOrSymbol we can make this more specific
   */
  export function validate(
    address: string,
    currencyNameOrSymbol?: string,
    networkType?: string,
  ): boolean
}
