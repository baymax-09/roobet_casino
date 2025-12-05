import { mongoose } from 'src/system'
import { type GameRound, getGameRoundSchema } from 'src/modules/game/types'
import { type DBCollectionSchema } from 'src/modules'

const GAME_NAME = 'cashdash'
export interface CashDashRound extends GameRound {
  gameName: typeof GAME_NAME
}

const CashDashRoundSchema = getGameRoundSchema<CashDashRound>(GAME_NAME)

export const CashDashRoundModel = mongoose.model<CashDashRound>(
  'cash_dash_rounds',
  CashDashRoundSchema,
)

export async function getCashDashRoundById(_id: string) {
  return await CashDashRoundModel.findOne({ _id })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: CashDashRoundModel.collection.name,
}
