import { getUserSelectedDisplayCurrency } from 'src/modules/currency/lib/currencyFormat'

import { displayCurrencyToAccountCurrency } from '../currencies'
import { formatUserBalance } from '../helpers'
import { type OneOffEvent } from '../actions'

interface BalanceRequest {
  action: 'Balance'
  secret: string
  externalPlayerId: string
  externalSessionId: string
  gameId: number
}

interface BalanceResponse {
  accountCurrency: string
  accountBalance: number // cents
  statusCode: number
  statusMessage: string
}

export const BALANCE_EVENT: OneOffEvent<BalanceRequest, BalanceResponse> = {
  process: async (request, user) => {
    const displayCurrency = await getUserSelectedDisplayCurrency(user.id)

    return {
      accountCurrency: displayCurrencyToAccountCurrency(displayCurrency),
      accountBalance: await formatUserBalance(user, displayCurrency),
      statusCode: 0,
      statusMessage: '',
    }
  },
}
