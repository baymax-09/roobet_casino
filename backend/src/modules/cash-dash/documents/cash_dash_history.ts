import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

import { type ActiveCashDashGame } from './active_cash_dash_games'

export interface CashDashHistory extends ActiveCashDashGame {
  _id?: string
}

interface CashDashGameFilter {
  betId?: string
  userId?: string
}

const CashDashHistorySchema = new mongoose.Schema<CashDashHistory>(
  {
    bet: { type: String, index: true },
    columns: Number,
    deck: Map,
    difficulty: String,
    poopPerRow: Number,
    rows: Number,
    played: Map,
    // @ts-expect-error string vs Date
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 60 * 60 * 24 * 30 * 3,
    },
    userId: { type: String, index: true },
  },
  { timestamps: true },
)

const CashDashHistoryModel = mongoose.model<CashDashHistory>(
  'cash_dash_histories',
  CashDashHistorySchema,
)

export async function insertCashDashHistory(game: ActiveCashDashGame) {
  await CashDashHistoryModel.create(game)
}

export async function getCashDashHistoryByBet(
  betId: string,
): Promise<CashDashHistory | null> {
  return await CashDashHistoryModel.findOne({ bet: betId })
}

export async function getCashDashHistoryForUser({
  filterObj,
  sortObj,
}: {
  filterObj: CashDashGameFilter
  sortObj?: any
}): Promise<CashDashHistory[]> {
  return await CashDashHistoryModel.find(filterObj).sort(sortObj).lean()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: CashDashHistoryModel.collection.name,
}
