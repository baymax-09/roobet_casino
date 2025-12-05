import moment from 'moment'

import { type Types as UserTypes, getUserById } from 'src/modules/user'
import { getSelectedBalanceFromUser } from 'src/modules/user/balance'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'

import { type PlayRequest } from './transactions/play'
import { getDisplayCurrencyFromRequest, createSoftswissId } from './currencies'

export async function getUserBalance(
  request: { user_id: string },
  toCurrency?: DisplayCurrency,
): Promise<number> {
  const user = await getUserById(request.user_id)
  if (!user) {
    return 0
  }

  const balanceReturn = await getSelectedBalanceFromUser({ user })

  if (toCurrency) {
    const displayBalance = await currencyExchange(
      balanceReturn.balance,
      toCurrency,
      true,
    )
    return Math.trunc(displayBalance * 100)
  }

  return Math.trunc(balanceReturn.balance * 100)
}

export const countryCodesNotToSend = ['US', 'UK', 'GB', 'CA']

export async function getUserRequestObject(
  user: UserTypes.User,
  countryCode = 'DE',
  currency: DisplayCurrency,
) {
  return {
    id: createSoftswissId(user.id, currency),
    email: 'no-reply@roobet.com',
    nickname: user.name,
    gender: 'm',
    date_of_birth: '1990-01-02',
    registered_at: moment(user.createdAt).format('YYYY-MM-DD'),
    firstname: user.name,
    lastname: user.name,
    country: countryCodesNotToSend.includes(countryCode) ? 'MX' : countryCode,
    city: 'Unknown',
  }
}

export async function checkPreconditions(
  request: PlayRequest,
  user: UserTypes.User,
): Promise<{ success: boolean; reason: string }> {
  if (!user) {
    return { success: false, reason: 'player deleted' }
  }
  const sessionCurrency = getDisplayCurrencyFromRequest(request)
  if (!sessionCurrency) {
    return { success: false, reason: 'invalid currency' }
  }

  let totalBet = 0
  const balanceReturn = await getSelectedBalanceFromUser({ user })
  const displayBalance = await currencyExchange(
    balanceReturn.balance,
    sessionCurrency,
    true,
  )
  for (const action of request.actions) {
    if (action.action === 'bet') {
      totalBet += action.amount
    }
    if ((displayBalance || 0) < totalBet / 100) {
      return { success: false, reason: 'insufficient balance' }
    }
  }
  return { success: true, reason: '' }
}
