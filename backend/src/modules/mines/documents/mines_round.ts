import { mongoose } from 'src/system'
import { type GameRound, getGameRoundSchema } from 'src/modules/game/types'
import { type DBCollectionSchema } from 'src/modules'

const GAME_NAME = 'mines'
export interface MinesRound extends GameRound {
  gameName: typeof GAME_NAME
}

const MinesRoundSchema = getGameRoundSchema<MinesRound>(GAME_NAME)

export const MinesRoundModel = mongoose.model<MinesRound>(
  'mines_rounds',
  MinesRoundSchema,
)

export async function getMinesRoundById(_id: string) {
  return await MinesRoundModel.findOne({ _id })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: MinesRoundModel.collection.name,
}
