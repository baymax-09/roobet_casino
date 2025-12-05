import { type YGGDRASIL_PROVIDER_NAME } from 'common/constants'

import { type GameTag, type GameTagEssential } from './gameTag'

type TPGameAggregator =
  | 'softswiss'
  | 'hacksaw'
  | 'playngo'
  | 'redtiger'
  | 'hub88'
  | 'pragmatic'
  | 'slotegrator'
  | 'roobet'
  | typeof YGGDRASIL_PROVIDER_NAME

// TODO: Make this into `TPGameSearchEssential` and make it extend a `TPGameEssential` type that has even less fields.
// The minimum required fields for a TPGame to render on the frontend in the game list
export interface TPGameEssential {
  id: string
  devices: string[]
  aggregator: TPGameAggregator
  category: string
  identifier: string
  provider: string
  title: string
  popularity: number
  squareImage: RoobetAssetPath<AssetType>
  releasedAt: Date
  tags: GameTagEssential[]
  tagPriorities: Record<string, number> | null
  createdAt: Date
}

export interface TPGame extends TPGameEssential {
  hasFreespins: boolean
  provider: string
  blacklist: string[]
  disabled: boolean
  recalled: boolean
  hasFunMode: boolean
  gid: string
  description: string
  releasedAt: Date
  payout?: number
  tagIds?: string[]
  tags: GameTag[]
  live?: boolean | null
  iframeSubdomain: string | null
}

export interface NormalizedTPGameEssential extends TPGameEssential {
  searchImage: string
  cachedSquareImage: string
  link: string
}

/** TPGames are transformed on frontend in a couple of places */
export type NormalizedTPGame = TPGame & NormalizedTPGameEssential
