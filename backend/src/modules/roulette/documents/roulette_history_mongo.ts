import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system/mongo'

import { type RouletteGame } from './roulette_games'
import { type OutcomeValue } from '../constant/roulette'

export interface RouletteHistory {
  id?: string
  gameId: string
  bettingEndTime: string
  bettingStartTime: string
  createdAt: string
  finalHash: string
  gameName: 'roulette'
  hash: string
  hashIndex: number
  index: number
  maxBet: number
  payoutEndTime: string
  payoutStartTime: string
  previousHash: string
  randomNumber: number
  resetEndTime: string
  resetStartTime: string
  roundEndTime: string
  roundStartTime: string
  spinNumber: OutcomeValue
  state: string
  winningNumber: number
  timestamp: Date
}

export interface RouletteHistoryMongo extends RouletteHistory {
  _id?: string
}

const RouletteHistoryMongoSchema = new mongoose.Schema<RouletteHistoryMongo>(
  {
    gameId: { type: String, index: true },
    bettingEndTime: Date,
    bettingStartTime: Date,
    createdAt: Date,
    finalHash: String,
    gameName: { type: String, enum: ['roulette'] },
    hash: String,
    hashIndex: Number,
    index: Number,
    maxBet: Number,
    payoutEndTime: Date,
    payoutStartTime: Date,
    previousHash: String,
    randomNumber: Number,
    resetEndTime: Date,
    resetStartTime: Date,
    roundEndTime: Date,
    roundStartTime: Date,
    spinNumber: Number,
    state: String,
    winningNumber: Number,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 60 * 60 * 24 * 30 * 3,
    },
  },
  { timestamps: true },
)

export const RouletteHistoryMongoModel = mongoose.model<RouletteHistoryMongo>(
  'roulette_history_mongo',
  RouletteHistoryMongoSchema,
)

export async function recordRouletteHistory(game: RouletteGame) {
  await RouletteHistoryMongoModel.create({ ...game, gameId: game.id })
}

/** Find game by legacy RethinkDB id */
export async function getRouletteGameById(
  gameId: string,
): Promise<RouletteHistoryMongo | null> {
  return await RouletteHistoryMongoModel.findOne({ gameId })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'roulette_history_mongo',
}
