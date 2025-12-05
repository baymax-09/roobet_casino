import { getUserSelectedDisplayCurrency } from 'src/modules/currency/lib/currencyFormat'

import { displayCurrencyToAccountCurrency } from '../currencies'
import { formatUserBalance } from '../helpers'
import { type OneOffEvent } from '../actions'

interface AuthenticateRequest {
  action: 'Authenticate'
  token: string
  gameId: string
  secret: string
}

interface AuthenticateResponse {
  externalPlayerId: string
  name?: string
  accountCurrency: string
  accountBalance: number // cents
  externalSessionId?: string
  languageId?: string
  countryId?: string
  birthDate?: string
  registrationDate?: string
  brandId?: string
  gender?: string
  statusCode: number
  statusMessage: string
}

export const AUTHENTICATE_EVENT: OneOffEvent<
  AuthenticateRequest,
  AuthenticateResponse
> = {
  process: async (request, user) => {
    // right now a token can be validated multiple times because otherwise the test suite would fail.
    // If it's a 100% hard requirement we will fix it after acceptance testing. My guess is it's not
    // a hard requirement.

    const displayCurrency = await getUserSelectedDisplayCurrency(user.id)

    return {
      externalPlayerId: user.id,
      name: user.name,
      accountCurrency: displayCurrencyToAccountCurrency(displayCurrency),
      accountBalance: await formatUserBalance(user, displayCurrency),
      externalSessionId: request.token,
      statusCode: 0,
      statusMessage: '',
    }
  },
}
