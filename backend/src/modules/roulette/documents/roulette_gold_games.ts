import { type UpdatePayload, type Document } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { mongoChangeFeedHandler } from 'src/util/mongo'
import {
  getBetaUserIdsWithFeatureFlag,
  getFeatureFlag,
} from 'src/util/features'
import {
  emitSocketEventForGame,
  emitSocketEventForGameForUser,
} from 'src/modules/game'
import { rouletteLogger } from '../lib/logger'

export interface RouletteGoldGamesDocument {
  someId: string
  gameIds: string
}

const RouletteGoldGamesSchema = new mongoose.Schema(
  {
    someId: { type: String, index: true },
    gameIds: { type: String },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 30 * 1,
    },
  },
  { timestamps: true },
)

type RouletteGoldGamesWithDocument = RouletteGoldGamesDocument & Document

const RouletteGoldGamesModel = mongoose.model<RouletteGoldGamesWithDocument>(
  'roulette_gold_games',
  RouletteGoldGamesSchema,
)

export async function insertGoldGame(
  GoldGame: RouletteGoldGamesDocument,
): Promise<RouletteGoldGamesDocument> {
  return await RouletteGoldGamesModel.create(GoldGame)
}

export async function getGoldGameById(
  someId: string,
): Promise<{ _id: any; someId: string; gameIds: string } | null> {
  const goldGame = await RouletteGoldGamesModel.find({ someId }).lean()
  if (!goldGame || goldGame.length === 0) {
    return null
  }
  return goldGame[0]
}

export async function updateRouletteGoldGameById(
  id: string,
  update: UpdatePayload<RouletteGoldGamesDocument>,
): Promise<RouletteGoldGamesDocument | null> {
  return await RouletteGoldGamesModel.findByIdAndUpdate(
    id,
    { ...update },
    { new: true, upsert: true },
  ).lean<RouletteGoldGamesDocument>()
}

/* FEEDS */
// Return everytime jackpot gold games is updated
const rouletteGoldGamesChangeFeed = async () => {
  try {
    await mongoChangeFeedHandler<RouletteGoldGamesWithDocument>(
      RouletteGoldGamesModel,
      async document => {
        if (document.fullDocument) {
          const { gameIds } = document.fullDocument
          let comboCount = 0
          if (gameIds) {
            const idsArray = JSON.parse(gameIds)
            if (idsArray) {
              comboCount = idsArray.length
            }
          }
          const featureFlag = await getFeatureFlag('housegames:roulette')
          if (featureFlag?.state === 'final') {
            emitSocketEventForGame('roulette', 'rouletteGoldGamesUpdated', {
              comboCount,
            })
          } else {
            const usersIdsWithFeatureFlag = await getBetaUserIdsWithFeatureFlag(
              'housegames:roulette',
            )
            usersIdsWithFeatureFlag.forEach(userId => {
              emitSocketEventForGameForUser(
                'roulette',
                userId,
                'rouletteGoldGamesUpdated',
                { comboCount },
              )
            })
          }
        }
      },
    )
  } catch (error) {
    rouletteLogger('rouletteGoldGamesChangeFeed', { userId: null }).error(
      'There was an error in the roulette gold games change feed',
      {},
      error,
    )
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'roulette_gold_games',
  feeds: [rouletteGoldGamesChangeFeed],
}
