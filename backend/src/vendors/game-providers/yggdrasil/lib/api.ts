import fetch from 'node-fetch'
import {
  type GameUpdaterGame,
  type GameUpdaterGames,
} from 'src/modules/tp-games/lib/types'
import { type User } from 'src/modules/user/types'
import {
  GameModeIntentMap,
  YGGDRASIL_LAUNCH_INTENT,
  YGGDRASIL_LAUNCH_REGION,
  YGGDRASIL_PROVIDER_NAME,
  YGGDRASIL_PROVIDER_NAME_TITLE_CASE,
  YggdrasilDisabledError,
  YggdrasilError,
  YggdrasilInvalidGameError,
  YggdrasilRemoteError,
  YggdrasilUrlIntents,
  YggdrasilUrlRegions,
  getConfig,
  isYggdrasilGame,
  type ApiMethodType,
  type GamesUpdaterResult,
  type YggdrasilGame,
  type YggdrasilUrlIntentType,
  type YggdrasilUrlRegionType,
} from '../types'
import { createAuthToken } from './auth'
import { getApiUrl, internalIdForYggId, yggdrasilTypeToCategory } from './utils'

const logScope = 'api'

export function getYggdrasilLaunchParams(
  mode: string | null,
  gameIdentifier: string,
) {
  const initial = mode ? GameModeIntentMap[mode] : null
  const intent: YggdrasilUrlIntentType =
    initial ??
    ((intent: any, fallback: YggdrasilUrlIntentType): YggdrasilUrlIntentType =>
      YggdrasilUrlIntents.includes(intent) ? intent : fallback)(
      YGGDRASIL_LAUNCH_INTENT,
      'test',
    )
  const region: YggdrasilUrlRegionType = ((
    region: any,
    fallback: YggdrasilUrlRegionType,
  ): YggdrasilUrlRegionType =>
    YggdrasilUrlRegions.includes(region) ? region : fallback)(
    YGGDRASIL_LAUNCH_REGION,
    'malta',
  )
  const gameId = parseInt(gameIdentifier.split(':')[1], 10)

  return { intent, region, gameId }
}

/**
 * Creates a Yggdrasil session for a {@link User user}}.
 * @param user The {@link User user} to create the session for.
 * @returns The game session ID.
 * @example
 * ```ts
 * const gameSessionId = await createYggdrasilSession(user)
 * ```
 */
export async function createYggdrasilSession(user: User): Promise<string> {
  const gameSessionId = createAuthToken(user)
  return gameSessionId
}

/**
 * The keyed paths for the Yggdrasil API.
 */
export const YggdrasilAPIPaths = {
  games: '/games',
}

/**
 * The type of the Yggdrasil API paths.
 */
export type YggdrasilAPIPathsType = typeof YggdrasilAPIPaths

/**
 * Updates the list of Yggdrasil games.
 * @returns A {@link GamesUpdaterResult} object containing the available and terminated games from Yggdrasil.
 */
export async function updateYggdrasilGamesList(): Promise<GamesUpdaterResult> {
  const now = new Date(Date.now())
  const freeSpins = ['freespins', 'free spins']
  const yggGames: YggdrasilGame[] =
    (await callApi('games', json => {
      if (!json.games || !Array.isArray(json.games)) {
        throw new YggdrasilInvalidGameError(logScope)
      }
      return json.games.filter(isYggdrasilGame)
    })) ?? []
  const games: GameUpdaterGames = yggGames.reduce((acc, game) => {
    const gameReleaseDate = new Date(game.globalReleaseDate)
    return {
      ...acc,
      [internalIdForYggId(game.id.toString())]: {
        gid: game.id.toString(),
        title: game.name,
        devices: ['desktop', 'mobile'],
        hasFreespins: game.features.some(feature =>
          freeSpins.includes(feature.toLowerCase()),
        ),
        aggregator: YGGDRASIL_PROVIDER_NAME,
        provider: YGGDRASIL_PROVIDER_NAME_TITLE_CASE,
        category: yggdrasilTypeToCategory(game.type),
        blacklist: [],
        hasFunMode: true,
        live: gameReleaseDate >= now,
        providerInternal: YGGDRASIL_PROVIDER_NAME,
        payout: Math.max(...game.rtpLevels.map(rtp => rtp.rtp)),
      } satisfies GameUpdaterGame,
    }
  }, {})
  return {
    games,
    recalls: [],
  }
}

/**
 * Calls the Yggdrasil API.
 * @param path The API path to call.
 * @param converter A function to convert the JSON response to the desired type.
 * @param method The HTTP method to use.
 * @param input The data to send to the API, if any.
 * @returns The converted response from the API.
 * @throws A {@link YggdrasilRemoteError} if the API call fails.
 */
async function callApi<TCon, TData>(
  path: keyof YggdrasilAPIPathsType,
  converter: (json: any) => TCon,
  method: ApiMethodType = 'GET',
  input?: TData,
): Promise<TCon | null> {
  const config = getConfig()
  if (config.enabled !== true) {
    throw YggdrasilError.logAndReturn(new YggdrasilDisabledError(logScope))
  }

  const finalUrl = getApiUrl(path)
  const response = await fetch(finalUrl, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: input ? JSON.stringify(input) : undefined,
  })
  if (!response.ok) {
    throw YggdrasilError.logAndReturn(
      new YggdrasilRemoteError(response, logScope),
    )
  }
  const output = await response.json()
  return converter(output)
}
