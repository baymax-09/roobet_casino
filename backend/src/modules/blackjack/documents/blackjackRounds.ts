import { type DBCollectionSchema } from 'src/modules'
import { type GameRound, getGameRoundSchema } from 'src/modules/game/types'
import { mongoose } from 'src/system'
import { BLACKJACK_GAME_NAME } from '../types'

export interface BlackjackRound extends GameRound {
  gameName: typeof BLACKJACK_GAME_NAME
}

const BlackjackRoundSchema =
  getGameRoundSchema<BlackjackRound>(BLACKJACK_GAME_NAME)

export const BlackjackRoundModel = mongoose.model<BlackjackRound>(
  'blackjack_rounds',
  BlackjackRoundSchema,
)

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: BlackjackRoundModel.collection.name,
}
