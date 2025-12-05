import { getUserSelectedDisplayCurrency } from 'src/modules/currency/lib/currencyFormat'

import { getUserGameCurrency } from '../documents/gameCurrency'

export const getGameCurrency = async (
  userId: string,
  gameIdentifier: string,
) => {
  const gameCurrency = await getUserGameCurrency({ userId, gameIdentifier })
  return (
    gameCurrency?.currency || (await getUserSelectedDisplayCurrency(userId))
  )
}
