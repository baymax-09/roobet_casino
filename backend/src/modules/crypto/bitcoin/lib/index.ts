import { getCurrencyPair } from 'src/modules/currency'
import { bitcoinBlockioApi } from 'src/vendors/blockio'

export { checkTxEligiblePrecredit } from './precredit'

export async function convertBitcoinToUserBalance(amount: number) {
  const currencyPair = await getCurrencyPair('btc', 'usd')
  return currencyPair?.exchangeRate ? amount * currencyPair.exchangeRate : 0.0
}

export async function convertUserBalanceToBitcoin(amount: number) {
  const currencyPair = await getCurrencyPair('btc', 'usd')
  return currencyPair?.exchangeRate ? amount / currencyPair.exchangeRate : 0.0
}

export function satoshisToBitcoin(amount: number) {
  return parseFloat((amount / 100000000.0).toFixed(8))
}

/**
 * Derive address for a wallet id by sending it to Blockio
 */
export async function deriveBitcoinWalletAddress(id: string): Promise<string> {
  return await bitcoinBlockioApi.makeAddressForWallet(id)
}
