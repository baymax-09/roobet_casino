import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'
import { getUserSelectedFiatCurrency } from 'src/modules/currency/types'
import { getSelectedBalanceFromUser } from 'src/modules/user/balance/lib'
import {
  stringOfLength,
  YGGDRASIL_LAUNCH_ORG,
  YggdrasilError,
  YggdrasilInvalidSessionTokenError,
  type YggdrasilPlayerInfoRequest,
  type YggdrasilPlayerInfoResponse,
} from '../../types'
import { getUserFromAuthToken } from '../auth'

const logScope = 'playerInfo'

/**
 * Handles the player info request.
 * @param req The player info request.
 * @returns The player info response.
 */
export async function handleYggdrasilPlayerInfo(
  req: YggdrasilPlayerInfoRequest,
): Promise<YggdrasilPlayerInfoResponse> {
  const { sessionToken } = req
  const user = await getUserFromAuthToken(sessionToken)
  if (!user) {
    throw YggdrasilError.logAndReturn(
      new YggdrasilInvalidSessionTokenError(sessionToken, logScope),
    )
  }

  // remove hyphens to shorten the id to 32 characters
  const playerId = user.id.replaceAll('-', '')
  const currency = getUserSelectedFiatCurrency(user)
  const { balance } = await getSelectedBalanceFromUser({ user })
  const currencyBalance = await currencyExchange(balance, currency)

  const res: YggdrasilPlayerInfoResponse = {
    code: 0,
    data: {
      balance: currencyBalance,
      country: stringOfLength(user.countryCode, 2, 0),
      currency: stringOfLength(currency, 3, 0),
      homeCurrency: stringOfLength(currency, 3, 0),
      organization: stringOfLength(YGGDRASIL_LAUNCH_ORG, 32, 0),
      playerId: stringOfLength(playerId, 32, 0),
    },
  }

  return res
}
