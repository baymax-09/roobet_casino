import { getCurrencyPair } from 'src/modules/currency'
import { dogecoinBlockioApi } from 'src/vendors/blockio'

export async function convertDogecoinToUserBalance(amount: number) {
  const currencyPair = await getCurrencyPair('doge', 'usd')
  return currencyPair?.exchangeRate ? amount * currencyPair.exchangeRate : 0.0
}

export async function convertUserBalanceToDogecoin(amount: number) {
  const currencyPair = await getCurrencyPair('doge', 'usd')
  return currencyPair?.exchangeRate ? amount / currencyPair.exchangeRate : 0.0
}

// derive address for a wallet id by sending it to block io
export async function deriveDogecoinWalletAddress(id: string): Promise<string> {
  return await dogecoinBlockioApi.makeAddressForWallet(id)
}
