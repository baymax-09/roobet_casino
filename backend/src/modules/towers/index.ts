export * as Documents from './documents'
export * as Routes from './routes'

export const GameName = 'towers'
export * as ActiveTowersGames from './documents/active_towers_games'

export type Card = 'poop' | 'fruit'
export type Difficulty =
  | 'easy'
  | '_easy'
  | 'medium'
  | '_medium'
  | 'hard'
  | '_hard'
  | '_spooky'
  | '_scary'
export interface Level {
  columns: number
  poopPerRow: number
}

export const Constants: { [key in Card]: key } = {
  poop: 'poop',
  fruit: 'fruit',
}

export const Levels: Record<Difficulty, Level> = {
  easy: {
    columns: 3,
    poopPerRow: 1,
  },
  medium: {
    columns: 2,
    poopPerRow: 1,
  },
  hard: {
    columns: 3,
    poopPerRow: 2,
  },
  _easy: {
    columns: 4,
    poopPerRow: 1,
  },
  _medium: {
    columns: 3,
    poopPerRow: 1,
  },
  _hard: {
    columns: 2,
    poopPerRow: 1,
  },
  _spooky: {
    columns: 3,
    poopPerRow: 2,
  },
  _scary: {
    columns: 4,
    poopPerRow: 3,
  },
}
