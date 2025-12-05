import { type FilterQuery } from 'mongoose'
import { type AsyncOrSync } from 'ts-essentials'

import { type TPGameBase, type TPGame } from '../documents/games'

export type GameUpdaterGame = Omit<TPGameBase, 'identifier'>
export type GameUpdaterGames = Record<string, GameUpdaterGame>
export type GameUpdateRecalls = Array<FilterQuery<TPGame>>

export type GameUpdater = () => AsyncOrSync<{
  games: GameUpdaterGames
  /** If a game is dynamically determined to be recalled in the updater, it can be deleted. Maybe in the future we will decline the game instead. */
  recalls: GameUpdateRecalls
}>

export type GameUpdaters = Record<string, GameUpdater>
