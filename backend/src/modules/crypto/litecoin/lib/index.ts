import { getCurrencyPair } from 'src/modules/currency'
import { litecoinBlockioApi } from 'src/vendors/blockio'

export async function convertLitecoinToUserBalance(amount: number) {
  const currencyPair = await getCurrencyPair('ltc', 'usd')
  return currencyPair?.exchangeRate ? amount * currencyPair.exchangeRate : 0.0
}

export async function convertUserBalanceToLitecoin(amount: number) {
  const currencyPair = await getCurrencyPair('ltc', 'usd')
  return currencyPair?.exchangeRate ? amount / currencyPair.exchangeRate : 0.0
}

// derive address for a wallet id by sending it to block io
export async function deriveLitecoinWalletAddress(id: string): Promise<string> {
  return await litecoinBlockioApi.makeAddressForWallet(id)
}
