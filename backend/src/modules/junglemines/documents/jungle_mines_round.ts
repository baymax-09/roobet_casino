import { mongoose } from 'src/system'
import { type GameRound, getGameRoundSchema } from 'src/modules/game/types'
import { type DBCollectionSchema } from 'src/modules'

const GAME_NAME = 'junglemines'
export interface JungleMinesRound extends GameRound {
  gameName: typeof GAME_NAME
}

const JungleMinesRoundSchema = getGameRoundSchema<JungleMinesRound>(GAME_NAME)

export const JungleMinesRoundModel = mongoose.model<JungleMinesRound>(
  'jungle_mines_rounds',
  JungleMinesRoundSchema,
)

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: JungleMinesRoundModel.collection.name,
}
