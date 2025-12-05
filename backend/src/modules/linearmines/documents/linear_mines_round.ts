import { mongoose } from 'src/system'
import { type GameRound, getGameRoundSchema } from 'src/modules/game/types'
import { type DBCollectionSchema } from 'src/modules'

const GAME_NAME = 'linearmines'
export interface LinearMinesRound extends GameRound {
  gameName: typeof GAME_NAME
}

const LinearMinesRoundSchema = getGameRoundSchema<LinearMinesRound>(GAME_NAME)

export const LinearMinesRoundModel = mongoose.model<LinearMinesRound>(
  'linear_mines_rounds',
  LinearMinesRoundSchema,
)

export async function getLinearMinesRoundById(_id: string) {
  return await LinearMinesRoundModel.findOne({ _id })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: LinearMinesRoundModel.collection.name,
}
