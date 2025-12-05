import { type RouletteGame } from '../documents/roulette_games'
export interface RouletteGameStateTransitionReturn {
  nextStateTimeout: number
  updatedGame: RouletteGame
}
export type RouletteGameStateTransition = (
  game: RouletteGame,
  previousGame: RouletteGame,
) => Promise<RouletteGameStateTransitionReturn>
export type RouletteGameStateDefinitions = Record<
  string,
  RouletteGameStateTransition
>
