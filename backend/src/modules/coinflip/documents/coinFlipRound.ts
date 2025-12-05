import { mongoose } from 'src/system'
import { type GameRound, getGameRoundSchema } from 'src/modules/game/types'
import { type DBCollectionSchema } from 'src/modules'

const GAME_NAME = 'coinflip'
export interface CoinFlipRound extends GameRound {
  gameName: typeof GAME_NAME
}

const CoinFlipRoundSchema = getGameRoundSchema<CoinFlipRound>(GAME_NAME)

export const CoinFlipRoundModel = mongoose.model<CoinFlipRound>(
  'coinflip_rounds',
  CoinFlipRoundSchema,
)

export async function getCoinFlipRoundById(_id: string) {
  return await CoinFlipRoundModel.findOne({ _id })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: CoinFlipRoundModel.collection.name,
}
