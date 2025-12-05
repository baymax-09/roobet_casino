import { mongoose } from 'src/system'
import { type GameRound, getGameRoundSchema } from 'src/modules/game/types'
import { type DBCollectionSchema } from 'src/modules'

const GAME_NAME = 'plinko'
export interface PlinkoRound extends GameRound {
  gameName: typeof GAME_NAME
}

const PlinkoRoundSchema = getGameRoundSchema<PlinkoRound>(GAME_NAME)

export const PlinkoRoundModel = mongoose.model<PlinkoRound>(
  'plinko_round',
  PlinkoRoundSchema,
)

export async function getPlinkoRoundById(_id: string) {
  return await PlinkoRoundModel.findOne({ _id })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'plinko_round',
}
