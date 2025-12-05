import crypto from 'crypto'

import { config } from 'src/system'
import { type User } from 'src/modules/user/types'

import { makeSlotegratorAPI } from '../../common/lib/api'
import {
  displayCurrencyToCurrencyCode,
  serializeRequestCurrency,
} from '../../common/lib/helpers'
import { sleep } from 'src/util/helpers/timer'
import { isAvailableLocale } from 'src/system/i18n'
import { getGame } from 'src/modules/tp-games/documents/games'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'
import { scopedLogger } from 'src/system/logger'
import {
  SLOTEGRATOR_SLOTS_DEFAULT_CURRENCY,
  checkCurrencySupportByProvider,
} from './currencies'
import { isValidSlotegratorSlotsProviderInternal } from './providers'
import { BasicCache } from 'src/util/redisModels'
import { isDisabled } from 'src/modules/tp-games/documents/blocks'

interface SlotegratorSlot {
  uuid: string
  name: string
  image: string
  type: string
  provider: string
  technology: string
  has_lobby: 1 | 0
  is_mobile: 1 | 0
  has_freespins: 1 | 0
  has_tables: 1 | 0
  freespins_valid_until_full_day: 1 | 0
  tags?: Array<{
    code: string
    label: string
  }>
  parameters?: object
  images?: Array<{
    name: string
    file: string
    url: string
    type: string
  }>
  related_games?: Array<{
    uuid: string
    is_mobile: 0 | 1
  }>
}

interface GamesListResponse {
  items: SlotegratorSlot[]
  _links: {
    self: { href: string }
    first: { href: string }
    last: { href: string }
    next: { href: string }
  }
  _meta: {
    totalCount: number
    pageCount: number
    currentPage: number
    perPage: number
  }
}

interface GamesInitRequest {
  game_uuid: string
  player_id: string
  player_name: string
  currency: string
  session_id: string
  return_url?: string
  language?: string
  email?: string
  lobby_data?: string
}

interface GamesInitDemoRequest {
  game_uuid: string
  return_url?: string
  language?: string
}

interface GamesInitResponse {
  url: string
}

interface SuccessResponsePayload {
  url: string
  supportedCurrencies?: DisplayCurrency[]
}
const makeSlotegratorSuccessResponse = (payload: SuccessResponsePayload) => {
  return { success: true, payload } as const
}

const makeSlotegratorErrorResponse = (message: string) => {
  return { success: false, error: { message } } as const
}

type SlotegratorSessionResp =
  | ReturnType<typeof makeSlotegratorErrorResponse>
  | ReturnType<typeof makeSlotegratorSuccessResponse>

interface SlotegratorLimit {
  amount: string
  currency: string
  providers: string[]
}
type SlotegratorLimitsResponse = SlotegratorLimit[]

const slotegratorSlotsApiLogger = scopedLogger('slotegratorSlots-api')

export const makeSlotegratorRequest = makeSlotegratorAPI({
  baseUrl: config.slotegrator.slots.baseUrl,
  merchantId: config.slotegrator.slots.merchantId,
  merchantKey: config.slotegrator.slots.merchantKey,
  bodySerializer: body => {
    return new URLSearchParams(body).toString()
  },
})

export const selfValidate = async () => {
  const response = await makeSlotegratorRequest({
    method: 'POST',
    path: 'self-validate',
    timeout: 60 * 1000,
  })

  return response
}

export const getAllSlots = async () => {
  const logger = slotegratorSlotsApiLogger('getAllSlots', { userId: null })
  try {
    let games: SlotegratorSlot[] = []
    let page = 0

    while (++page) {
      const response = await makeSlotegratorRequest<GamesListResponse>({
        path: `games?page=${page}&perPage=1000`,
      })

      games = games.concat(response.items)

      // The API has pretty strict rate limiting, this timeout seems to suffice.
      await sleep(500)

      if (response._meta.pageCount === page) {
        break
      }
    }

    return games
  } catch (error) {
    logger.error('failed to get all slots games', error.response.data)
    throw error
  }
}

export const checkEnvironmentLimits = async () => {
  const logger = slotegratorSlotsApiLogger('checkEnvironmentLimits', {
    userId: null,
  })
  return await BasicCache.cached(
    'slotegratorSlots',
    'limits',
    60 * 60,
    async () => {
      try {
        const response: SlotegratorLimitsResponse =
          await makeSlotegratorRequest({
            path: 'limits',
            method: 'GET',
          })
        logger.debug('limits', response)
        return response
      } catch (error) {
        logger.error('checkLimits call failed', error.response.data)
        throw error
      }
    },
  )
}

export const createSlotegratorSlotsSession = async (
  user: User | undefined = undefined,
  gameIdentifier: string,
  gameCurrency: string | null | undefined,
): Promise<SlotegratorSessionResp> => {
  const game = await getGame({ identifier: gameIdentifier })
  const logger = slotegratorSlotsApiLogger('createSlotegratorSlotsSession', {
    userId: user?.id || null,
  })

  if (!game) {
    return makeSlotegratorErrorResponse('Game not found or not approved')
  }

  const isGameDisabled = isDisabled(game, user)
  if (!isGameDisabled) {
    return makeSlotegratorErrorResponse('Game not found or not approved')
  }

  const displayCurrency = serializeRequestCurrency(gameCurrency)
  if (!displayCurrency) {
    return makeSlotegratorErrorResponse('Currency not supported')
  }

  if (!isValidSlotegratorSlotsProviderInternal(game.providerInternal)) {
    return makeSlotegratorErrorResponse('Provider not supported')
  }

  const supportedCurrencies = await checkCurrencySupportByProvider(
    game.providerInternal,
  )
  const supportedCurrency = supportedCurrencies?.includes(displayCurrency)

  const gameInitCurrency = displayCurrencyToCurrencyCode(
    supportedCurrency ? displayCurrency : SLOTEGRATOR_SLOTS_DEFAULT_CURRENCY,
  )

  try {
    const language = (() => {
      // Default to English.
      if (!user?.locale || !isAvailableLocale(user.locale)) {
        return 'en'
      }

      return user.locale
    })()

    // --- Demo Mode
    if (!user) {
      const response = await makeSlotegratorRequest<
        GamesInitResponse,
        GamesInitDemoRequest
      >({
        path: 'games/init-demo',
        method: 'POST',
        data: {
          language,
          game_uuid: game.gid,
        },
      })

      return makeSlotegratorSuccessResponse({ url: response.url })
    }

    // --- Real Mode
    const response = await makeSlotegratorRequest<
      GamesInitResponse,
      GamesInitRequest
    >({
      path: 'games/init',
      method: 'POST',
      data: {
        language,
        game_uuid: game.gid,
        currency: gameInitCurrency,
        player_id: user.id,
        player_name: user.name,
        session_id: crypto.randomBytes(16).toString('hex'),
      },
    })
    return makeSlotegratorSuccessResponse({
      url: response.url,
      ...(!supportedCurrency && { supportedCurrencies }),
    })
  } catch (error) {
    logger.error(
      `failed to create slots session for user: ${user?.id ?? 'demo'}`,
      error.response.data,
    )
    return makeSlotegratorErrorResponse(error.response.data.message)
  }
}
