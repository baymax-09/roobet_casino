import { mongoose } from 'src/system'
import { type GameRound, getGameRoundSchema } from 'src/modules/game/types'
import { type DBCollectionSchema } from 'src/modules'

const GAME_NAME = 'hilo'
export interface HiloRound extends GameRound {
  gameName: typeof GAME_NAME
}

const HiloRoundSchema = getGameRoundSchema<HiloRound>(GAME_NAME)

export const HiloRoundModel = mongoose.model<HiloRound>(
  'hilo_rounds',
  HiloRoundSchema,
)

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: HiloRoundModel.collection.name,
}
