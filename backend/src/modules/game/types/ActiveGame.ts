import { type BaseDocument } from 'rethinkdbdash'

export interface ActiveGame extends BaseDocument {
  id: string
  userId: string
  gameName?: string
  bet?: string
  maxBet?: number
}
