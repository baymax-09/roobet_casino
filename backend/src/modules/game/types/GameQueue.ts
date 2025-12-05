import { type HouseGamesWithRoundTable } from './'

export type AvailableGames = Extract<HouseGamesWithRoundTable, 'coinflip'>
interface BaseGameMessage<T> {
  gameName: AvailableGames
  /** Basically the DB game record */
  gameInfo: T
  /** number of times the message has been re-published */
  attempts?: number
  /** The timestamp when the balance should update on the client. Balances may be delayed in cases such as lengthy animations. */
  balanceUpdateTimestamp?: Date
}

export type GameResolutionMessage<T> = BaseGameMessage<T>

export interface GameResolutionActionResponse<T> {
  message: GameResolutionMessage<T>
}

export type GameResolutionInterfaceResponse<T> =
  | {
      success: false
      error: {
        code: number
        message: string
      }
    }
  | {
      success: true
      gameInfo: T
    }

// Should these functions return something? Like a boolean
export interface GameResolutionInterface<T> {
  validateGame: (
    message: GameResolutionMessage<T>,
  ) => Promise<GameResolutionInterfaceResponse<T>>
  calculateGameResult: (
    message: GameResolutionMessage<T>,
  ) => Promise<GameResolutionInterfaceResponse<T>>
  closeoutBet: (
    message: GameResolutionMessage<T>,
  ) => Promise<GameResolutionInterfaceResponse<T>>
  onError: (
    message: GameResolutionMessage<T>,
    error: { message: string; code?: number },
  ) => Promise<boolean>
}
