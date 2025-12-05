import { type useDialogsOpener } from 'app/hooks'

import { type User } from './user'

export type HouseGame = (typeof HOUSE_GAMES)[number]
export const isHouseGame = (title: any): title is HouseGame =>
  HOUSE_GAMES.includes(title)

export type HouseGameWithHistory = (typeof HOUSE_GAMES_WITH_HISTORY)[number]

export interface GameProps {
  user?: User
  apiUrl: string
  socketUrl: string
  locale: string
  currency: string
  openDialog: ReturnType<typeof useDialogsOpener>
  /** This is null if there is no user or the game cannot be favorited. */
  toggleFavorited: (() => Promise<void>) | null
  /** This is null if there is no user or the game cannot be favorited. */
  isFavorited: boolean | null
}

export type NativeGameImport = (props: GameProps) => JSX.Element

type HouseGamesNative = Record<
  string,
  {
    importPackage: () => Promise<NativeGameImport>
    featureFlag?: string
  }
>

export const HOUSE_GAMES = [
  'mines',
  'crash',
  'roulette',
  'towers',
  'dice',
  'plinko',
  'hotbox',
  'coinflip',
  'cashdash',
  'junglemines',
  'linearmines',
  'blackjack',
] as const

// add new games with user-specific game data
export const HOUSE_GAMES_WITH_HISTORY = [
  'mines',
  'plinko',
  'towers',
  'coinflip',
  'blackjack',
] as const

export const HOUSE_GAMES_NATIVE: HouseGamesNative = {
  'housegames:dice': {
    importPackage: async () => {
      const { default: Dice } = await import('@project-atl/dice-native')
      return Dice as NativeGameImport
    },
  },
  'housegames:linearmines': {
    importPackage: async () => {
      const { default: MissionUncrossable } = await import(
        '@project-atl/mission-uncrossable-native'
      )
      return MissionUncrossable as NativeGameImport
    },
  },
  'housegames:coinflip': {
    importPackage: async () => {
      const { default: CoinflipNative } = await import(
        '@project-atl/coinflip-native'
      )
      return CoinflipNative as NativeGameImport
    },
  },
  'housegames:towers': {
    importPackage: async () => {
      const { default: CoinflipNative } = await import(
        '@project-atl/towers-native'
      )
      return CoinflipNative as NativeGameImport
    },
  },
  'housegames:mines': {
    importPackage: async () => {
      const { default: MinesNative } = await import('@project-atl/mines-native')
      return MinesNative as NativeGameImport
    },
  },
} as const

export const isNativeHouseGame = (
  gameIdentifier: string,
  enabledFeatures: string[],
): boolean => {
  const native = HOUSE_GAMES_NATIVE[gameIdentifier]

  if (!native) {
    return false
  }

  if (!native.featureFlag) {
    return true
  }

  return enabledFeatures.includes(native.featureFlag)
}
