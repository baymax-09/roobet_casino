interface GameTagMinifiedGame {
  id: string
  identifier: string
  __typename: 'TPGame'
}

export interface GameTagNotCached {
  id: string
  title: string
  slug: string
  excludeFromTags: boolean
  games: GameTagMinifiedGame[]
  enabled: boolean
  startDate: Date | null
  endDate: Date | null
  enableDates: boolean
  order: number
  pageSize: number
  showOnHomepage: boolean
  __typename: 'GameTag'
}

export interface GameTagsNotCachedQueryReturn {
  gameTagsNotCached: GameTagNotCached[]
}
