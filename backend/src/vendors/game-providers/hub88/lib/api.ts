import axios from 'axios'

import { config } from 'src/system'
import { APIValidationError } from 'src/util/errors'
import { type Types as UserTypes } from 'src/modules/user'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'
import { getGame } from 'src/modules/tp-games/documents/games'
import { updateUserGameCurrency } from 'src/modules/user/documents/gameCurrency'

import { generateAuthToken, generateSignatureForPayload } from './auth'
import {
  getUnsupportedCurrencies,
  type Hub88DemoCurrency,
  displayCurrencyToCurrencyCode,
} from './currencies'
import { hub88Logger } from './logger'

export async function postApi(path: string, data: any) {
  const logger = hub88Logger('postApi', { userId: null })
  const signature = generateSignatureForPayload(data)
  try {
    logger.info('request', {
      method: 'post',
      url: `${config.hub88.apiUrl}${path}`,
      data,
      headers: {
        'X-Hub88-Signature': signature,
      },
    })
    const response = await axios({
      method: 'post',
      url: `${config.hub88.apiUrl}${path}`,
      data,
      headers: {
        'X-Hub88-Signature': signature,
      },
    })

    return response.data
  } catch (error) {
    logger.error('ApiError', {}, error)
    if (error.response && error.response.data) {
      throw error.response.data.error
    }
    throw new APIValidationError(
      'This game is currently unavailable. Please contact support if the problem persists.',
    )
  }
}

export async function listGames() {
  return await postApi('/operator/generic/v2/game/list', {
    operator_id: config.hub88.operatorId,
  })
}

interface GetGameURLParams {
  user: UserTypes.User | undefined
  gameIdentifier?: string
  platform?: string
  requestingIp: string | undefined
  currency: DisplayCurrency | Hub88DemoCurrency
  country?: string
  returnUrl: string
}

export async function getGameUrl({
  user,
  gameIdentifier,
  platform = 'desktop',
  requestingIp: ip,
  currency,
  country = 'CA',
  returnUrl,
}: GetGameURLParams) {
  const token = user ? generateAuthToken(user) : undefined

  let supportedCurrencies: DisplayCurrency[] | undefined
  let hub88DisplayCurrency = displayCurrencyToCurrencyCode(currency)

  const userId = user?.id

  // The 'XXX' currency is used for demo games.
  if (currency !== 'XXX' && userId && gameIdentifier) {
    // Grab provider from tp-game.
    const tpGame = await getGame({ identifier: gameIdentifier })
    const provider = tpGame?.provider

    const unsupportedCurrencies = getUnsupportedCurrencies(provider)
    // If unsupported currency, default to USD.
    if (unsupportedCurrencies.includes(currency)) {
      hub88DisplayCurrency = 'USD'
      // Only send supported currencies to frontend.
      supportedCurrencies = config.displayCurrencies.filter(
        currency => !unsupportedCurrencies.includes(currency),
      )
      await updateUserGameCurrency({ userId, gameIdentifier, currency: 'usd' })
    } else {
      await updateUserGameCurrency({ userId, gameIdentifier, currency })
    }
  }

  const game_code = gameIdentifier?.split(':')[1]

  try {
    const response = await postApi('/operator/generic/v2/game/url', {
      user: userId,
      token,
      sub_partner_id: config.hub88.subPartnerId, // editable in back-office
      platform: platform === 'desktop' ? 'GPL_DESKTOP' : 'GPL_MOBILE',
      operator_id: config.hub88.operatorId,
      meta: {
        // rating: 10,
        // oddsType: 'decimal'
      },
      lobby_url: `${returnUrl}`,
      lang: user?.locale || 'en',
      ip,
      ...(game_code && { game_code }),
      deposit_url: `${returnUrl}/?modal=cashier&tab=deposit`,
      currency: hub88DisplayCurrency,
      country: user?.countryCode || country,
    })
    return { url: response.url, error: null, supportedCurrencies }
  } catch (error) {
    hub88Logger('getGameUrl', { userId: userId ?? null }).error(
      'failed to fetch game url',
      {},
      error,
    )
    return { url: null, error }
  }
}
