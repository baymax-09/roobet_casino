import axios from 'axios'

import { config } from 'src/system'
import { type User } from 'src/modules/user/types'

import { generateAuthToken } from './auth'
import { hacksawLogger } from './logger'

interface HacksawGameListResponse extends HacksawStatusResponse {
  data: HacksawGame[]
}

interface RtpVariation {
  isDefault: boolean
  variation: number
  theoreticalRTP: number
  expectedHitFrequency: number
}

interface BonusBuyOption {
  bonusGameId: string
  betCostMultiplier: number
  expectedRtp: number
}

export interface HacksawGame {
  gameId: number
  gameType: string
  gameName: string
  betLevels: number[]
  rtpVariations: RtpVariation[]
  bonusBuyOptions: BonusBuyOption[]
}

export interface HacksawStatusResponse {
  statusCode: number
  statusMessage: string
}

interface HacksawRequestParams {
  path: string
  method?: 'GET' | 'POST'
  data?: object
}

export const makeHacksawRequest = async <T extends HacksawStatusResponse>({
  path,
  method = 'GET',
  data,
}: HacksawRequestParams): Promise<T | null> => {
  const logger = hacksawLogger('makeHacksawRequest', { userId: null })
  const url = `${config.hacksaw.baseUrl}/${path}`

  try {
    const response: { data: T } = await axios({
      method,
      url,
      data: data ?? {},
      headers: {},
    })

    // Not successful if any status code other than 0
    if (response.data.statusCode !== 0) {
      logger.error('API request failed', {
        statusMessage: response.data.statusMessage,
      })
      return null
    }

    return response.data
  } catch (error) {
    logger.error('API request failed', {}, error)
    return null
  }
}

export const createHacksawSession = async (
  user: User,
): Promise<{ gameSessionId: string }> => {
  const gameSessionId = generateAuthToken(user)

  return { gameSessionId }
}

export const getAllGames = async (): Promise<HacksawGame[]> => {
  try {
    const response = await makeHacksawRequest<HacksawGameListResponse>({
      path: `v1/meta/${config.hacksaw.partnerId}/gameList`,
      method: 'GET',
    })

    return response ? response?.data : []
  } catch (error) {
    hacksawLogger('getAllGames', { userId: null }).error(
      'failed to get all games',
      {},
      error,
    )
    throw error
  }
}
