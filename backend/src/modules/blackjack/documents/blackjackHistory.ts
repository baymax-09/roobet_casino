import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'
import {
  type GameState,
  type Hand,
  type HandActionInsurance,
  type HandActionSplit,
  type HandActionWithShoe,
  type HandActions,
  type HandStatus,
  type PlayerCard,
  type PlayerSeat,
  type UserHandMainWager,
  type UserHandSideWager,
} from '../types'
import {
  CardSchemaBlock,
  GamesSchemaBlock,
  HandActionInsuranceSchemaBlock,
  HandActionSchemaBlock,
  HandActionSplitSchemaBlock,
  HandActionWithShoeSchemaBlock,
  HandMainWagerSchemaBlock,
  HandSchemaBlock,
  HandSideWagerSchemaBlock,
  HandStatusSchemaBlock,
  PlayerSchemaBlock,
  setHandActionsSchemaDiscriminators,
  toObjectOptions,
  type DBBlackjackGame,
} from './blackjackSchemas'

export const BlackjackHandStatusSchema = new mongoose.Schema<HandStatus>(
  ...HandStatusSchemaBlock(),
)
export const BlackjackCardSchema = new mongoose.Schema<PlayerCard>(
  ...CardSchemaBlock(),
)
export const BlackjackHandActionSchema = new mongoose.Schema<HandActions>(
  ...HandActionSchemaBlock(),
)
export const BlackjackHandActionWithShoeSchema =
  new mongoose.Schema<HandActionWithShoe>(...HandActionWithShoeSchemaBlock())
export const BlackjackHandActionInsuranceSchema =
  new mongoose.Schema<HandActionInsurance>(...HandActionInsuranceSchemaBlock())
export const BlackjackHandActionSplitSchema =
  new mongoose.Schema<HandActionSplit>(...HandActionSplitSchemaBlock())

setHandActionsSchemaDiscriminators(
  BlackjackHandActionSchema,
  BlackjackHandActionWithShoeSchema,
  BlackjackHandActionInsuranceSchema,
  BlackjackHandActionSplitSchema,
)

export const BlackjackHandSideWagerSchema =
  new mongoose.Schema<UserHandSideWager>(...HandSideWagerSchemaBlock())
const BlackjackHandMainWagerSchema = new mongoose.Schema<UserHandMainWager>(
  ...HandMainWagerSchemaBlock(BlackjackHandSideWagerSchema),
)
const BlackjackHandSchema = new mongoose.Schema<Hand>(
  ...HandSchemaBlock(
    BlackjackHandMainWagerSchema,
    BlackjackCardSchema,
    BlackjackHandStatusSchema,
    BlackjackHandActionSchema,
  ),
)
const BlackjackPlayerSchema = new mongoose.Schema<PlayerSeat>(
  ...PlayerSchemaBlock(BlackjackHandSchema),
)
const BlackjackHistoriesSchema = new mongoose.Schema<DBBlackjackGame>(
  GamesSchemaBlock(BlackjackPlayerSchema),
  { timestamps: true, toObject: toObjectOptions },
)

BlackjackHistoriesSchema.index({ createdAt: 1 })

/**
 * The Blackjack game history model.
 */
export const BlackjackGameHistoryModel = mongoose.model<DBBlackjackGame>(
  'blackjack_histories',
  BlackjackHistoriesSchema,
)

/**
 * The {@link BlackjackPagedHistory.total total} record count, and the current
 * page of {@link BlackjackPagedHistory.records records} for a paged history request.
 */
export interface BlackjackPagedHistory {
  total: number
  records: GameState[]
}

/**
 * Records a Blackjack {@link GameState} in history.
 * @param game The {@link GameState} to record.
 * @returns The {@link GameState} that was recorded.
 */
export async function recordHistory(game: GameState): Promise<GameState> {
  const gameWithId = { ...game, _id: game.id }
  const results = await BlackjackGameHistoryModel.insertMany([gameWithId])
  return results[0].toObject<GameState>()
}

/**
 * Gets a Blackjack {@link GameState} from history by {@link betId}.
 * @param betId The {@link betId} to search for.
 * @returns The {@link GameState} that was found, or `null` if not found.
 */
export async function getHistoryByBetId(
  betId: string,
): Promise<GameState | null> {
  const record = await BlackjackGameHistoryModel.findOne({
    players: { $elemMatch: { betId } },
  })
  if (!record) {
    return null
  }
  return record.toObject<GameState>()
}

/**
 * Gets Blackjack {@link GameState}s from history by {@link playerId}.
 * @param playerId The {@link playerId} to search for.
 * @param limit The maximum number of records to return.
 * @param offset The number of records to skip.
 * @returns The {@link GameState}s that were found.
 */
export async function getHistoryForPlayer(
  playerId: string,
  limit = 10,
  offset = 0,
): Promise<BlackjackPagedHistory> {
  const query = { players: { $elemMatch: { playerId } } }
  const [count, records] = await Promise.all([
    BlackjackGameHistoryModel.countDocuments(query),
    BlackjackGameHistoryModel.find(query).skip(offset).limit(limit),
  ])
  return {
    total: count,
    records: records.map(record => record.toObject<GameState>()),
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: BlackjackGameHistoryModel.collection.name,
}
