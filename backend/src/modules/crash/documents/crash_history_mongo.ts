import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

import { type CrashState } from '../lib/helpers/states'
import { type CrashGame } from './crash_game'

export interface CrashHistory {
  bettingEndTime: string
  bettingStartTime: string
  createdAt: string
  finalHash: string
  gameId: string
  gameName: 'crash'
  crashPoint: number
  hash: string
  hashIndex: number
  index: number
  maxBet: number
  previousHash: string
  randomNumber: number
  runningMs: number
  runningStartTime: string
  state: CrashState
  timestamp: Date
}

const CrashHistoryMongoSchema = new mongoose.Schema<CrashHistory>(
  {
    bettingEndTime: Date,
    bettingStartTime: Date,
    createdAt: Date,
    finalHash: String,
    gameId: { type: String, index: true },
    gameName: { type: String, enum: ['crash'] },
    crashPoint: Number,
    hash: String,
    hashIndex: Number,
    index: Number,
    maxBet: Number,
    previousHash: String,
    randomNumber: Number,
    runningMs: Number,
    runningStartTime: Date,
    state: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 60 * 60 * 24 * 30 * 3,
    },
  },
  { timestamps: true },
)

const CrashHistoryMongo = mongoose.model<CrashHistory>(
  'crash_history_mongo',
  CrashHistoryMongoSchema,
)

export async function recordCrashHistory(game: CrashGame) {
  await CrashHistoryMongo.create({ ...game, gameId: game.id })
}

// find game by legacy rethinkdb id
export async function getCrashGameById(gameId: string) {
  return await CrashHistoryMongo.findOne({ gameId }).lean<CrashHistory | null>()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'crash_history_mongo',
}
