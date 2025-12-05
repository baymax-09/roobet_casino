import { mongoose } from 'src/system'
import { type GameRound, getGameRoundSchema } from 'src/modules/game/types'
import { type DBCollectionSchema } from 'src/modules'

const GAME_NAME = 'towers'
export interface TowersRound extends GameRound {
  gameName: typeof GAME_NAME
}

const TowersRoundSchema = getGameRoundSchema<TowersRound>(GAME_NAME)

export const TowersRoundModel = mongoose.model<TowersRound>(
  'towers_rounds',
  TowersRoundSchema,
)

export async function getTowersRoundById(_id: string) {
  return await TowersRoundModel.findOne({ _id })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: TowersRoundModel.collection.name,
}
