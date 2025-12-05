import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

import { type HotboxState } from '../lib/helpers/states'
import { type HotboxGame } from './hotbox_game'

export interface HotboxHistory {
  bettingEndTime: string
  bettingStartTime: string
  createdAt: string
  finalHash: string
  gameId: string
  gameName: 'hotbox'
  crashPoint: number
  hash: string
  hashIndex: number
  index: number
  maxBet: number
  previousHash: string
  randomNumber: number
  runningMs: number
  runningStartTime: string
  state: HotboxState
  timestamp: Date
}

const HotboxHistorySchema = new mongoose.Schema<HotboxHistory>(
  {
    bettingEndTime: Date,
    bettingStartTime: Date,
    createdAt: Date,
    finalHash: String,
    gameId: { type: String, index: true },
    gameName: { type: String, enum: ['hotbox'] },
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

const HotboxHistoryMongo = mongoose.model<HotboxHistory>(
  'hotbox_history',
  HotboxHistorySchema,
)

export async function recordHotboxHistory(game: HotboxGame) {
  await HotboxHistoryMongo.create({ ...game, gameId: game.id })
}

// find game by legacy rethinkdb id
export async function getHotboxGameById(gameId: string) {
  return await HotboxHistoryMongo.findOne({
    gameId,
  }).lean<HotboxHistory | null>()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'hotbox_history',
}
