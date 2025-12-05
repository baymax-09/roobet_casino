import {
  type GameUpdateRecalls,
  type GameUpdaterGames,
} from 'src/modules/tp-games/lib/types'

/**
 * The type of a method to call the remote API.
 */
export type ApiMethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * An error from the remote API
 */
export interface RemoteApiError {
  url: string
  status: number
  statusText: string
}

/**
 * The result of a games updater.
 */
export interface GamesUpdaterResult {
  /**
   * The games that are available from the provider.
   */
  games: GameUpdaterGames

  /**
   * The games that have been terminated/unpublished by the provider.
   *
   * Games that are dynamically determined to be recalled in the updater can be deleted.
   */
  recalls: GameUpdateRecalls
}

/**
 * A Yggdrasil game RTP level.
 */
export interface YggdrasilGameRTP {
  rtp: number
  rtpGroup: string
}

/**
 * A Yggdrasil game.
 */
export interface YggdrasilGame {
  id: number
  name: string
  type: string
  globalReleaseDate: string
  rtpLevels: YggdrasilGameRTP[]
  features: string[]
}

/**
 * Check if a game is a {@link YggdrasilGame} or not.
 * @param game The game to check
 * @returns `true` if the game is a {@link YggdrasilGame}, `false` otherwise
 */
export function isYggdrasilGame(game: any): game is YggdrasilGame {
  return (
    typeof game === 'object' &&
    typeof game.id === 'number' &&
    typeof game.name === 'string' &&
    typeof game.type === 'string' &&
    typeof game.globalReleaseDate === 'string' &&
    Array.isArray(game.rtpLevels) &&
    game.rtpLevels.every(
      (rtp: any) =>
        typeof rtp === 'object' &&
        typeof rtp.rtp === 'number' &&
        typeof rtp.rtpGroup === 'string',
    ) &&
    Array.isArray(game.features) &&
    game.features.every((feature: any) => typeof feature === 'string')
  )
}
