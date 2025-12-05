import crypto from 'crypto'
import fetch from 'node-fetch'

import { type User } from 'src/modules/user/types'
import { config } from 'src/system'
import { isAvailableLocale } from 'src/system/i18n'

import { makeSlotegratorAPI } from '../../common'
import { slotegratorLogger } from '../../common/lib/logger'

interface SportsbookInitResponse {
  url: string
}

type SportsbookListResponse = Array<{
  id: number
  uuid: string
  name: string
  providerId: number
  type: string
  externalId: string
  technology: number
}>

export const makeSlotegratorRequest = makeSlotegratorAPI({
  baseUrl: config.slotegrator.sports.baseUrl,
  merchantId: config.slotegrator.sports.merchantId,
  merchantKey: config.slotegrator.sports.merchantKey,
})

export const getAllSportsbookGames = async () => {
  try {
    const response = await makeSlotegratorRequest<SportsbookListResponse>({
      path: 'sportsbooks',
    })

    return response
  } catch (error) {
    slotegratorLogger('getAllSportsbookGames', { userId: null }).error(
      'failed to get all sports games',
      {},
      error,
    )
    throw error
  }
}

export const createSportsbookSession = async (
  user: User,
): Promise<{ token: string | null; url: string | null }> => {
  try {
    const language = (() => {
      // Default to English.
      if (!user.locale || !isAvailableLocale(user.locale)) {
        return 'en'
      }

      return user.locale
    })()

    const response = await makeSlotegratorRequest<SportsbookInitResponse>({
      path: 'sportsbooks/init',
      method: 'POST',
      data: {
        sportsbook_uuid: config.slotegrator.sports.sportsbookUuid,
        session_id: crypto.randomBytes(16).toString('hex'),
        currency: config.slotegrator.currency,
        player_id: user.id,
        player_name: user.name,
        language,
      },
    })

    if (!response.url) {
      return {
        token: null,
        url: null,
      }
    }

    const request = await fetch(response.url)

    const content = await request.text()

    // Safely pull the key out of the page content.
    const [, options] = content.match(/initialize\(([\S\s]+)\)/m) ?? []
    const [, key] = (options ?? '').match(/key: '([A-z0-9]+)'/) ?? []

    return { token: key ?? null, url: response.url }
  } catch (error) {
    slotegratorLogger('createSportsbookSession', { userId: user.id }).error(
      'failed to create session',
      {},
      error,
    )
    throw error
  }
}
