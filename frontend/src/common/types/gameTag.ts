import { type TPGame } from './tpGame'

export interface GameTagEssential {
  id: string
  slug: string
  excludeFromTags: boolean
}

export interface GameTag extends GameTagEssential {
  games?: [TPGame]
  title: string
  pageSize: number
  showOnHomepage?: boolean
  order?: number
}

export interface GameTagsResults {
  gameTags: GameTag[]
}
