import { mongoose } from 'src/system'
import { type GameRound, getGameRoundSchema } from 'src/modules/game/types'
import { type DBCollectionSchema } from 'src/modules'

const GAME_NAME = 'dice'
export interface DiceRound extends GameRound {
  gameName: typeof GAME_NAME
}

const DiceRoundSchema = getGameRoundSchema<DiceRound>(GAME_NAME)

// TODO stop exporting after encapsulating all references
export const DiceRoundModel = mongoose.model<DiceRound>(
  'dice_round',
  DiceRoundSchema,
)

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'dice_round',
}
