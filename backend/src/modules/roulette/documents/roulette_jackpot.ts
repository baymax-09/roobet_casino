import { type UpdatePayload } from 'mongoose'

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

export interface BaseRouletteJackpot {
  jackpotId: string
  jackpotAmount: number
}

export interface RouletteJackpot extends BaseRouletteJackpot {
  createdAt: Date
  updatedAt: Date
}

const RouletteJackpotSchema = new mongoose.Schema<RouletteJackpot>(
  {
    jackpotId: { type: String, index: true },
    jackpotAmount: { type: Number },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 30 * 1,
    },
  },
  { timestamps: true },
)

export const RouletteJackpotModel = mongoose.model<RouletteJackpot>(
  'roulette_jackpot',
  RouletteJackpotSchema,
)

export async function insertRouletteJackpot(
  rouletteJackpot: BaseRouletteJackpot,
): Promise<RouletteJackpot> {
  return await RouletteJackpotModel.create(rouletteJackpot)
}

export async function getRouletteJackpotById(
  jackpotId: string,
): Promise<{ _id: any; jackpotId: string; jackpotAmount: number } | null> {
  const rouletteJackpot = await RouletteJackpotModel.find({ jackpotId }).lean()
  if (!rouletteJackpot || rouletteJackpot.length === 0) {
    return null
  }

  return rouletteJackpot[0]
}

export async function updateRouletteJackpotById(
  id: string,
  update: UpdatePayload<RouletteJackpot>,
): Promise<RouletteJackpot | null> {
  return await RouletteJackpotModel.findByIdAndUpdate(
    id,
    { ...update },
    { new: true, upsert: true },
  ).lean<RouletteJackpot>()
}

/* FEEDS */
// Return everytime jackpot amount is updated
const rouletteJackpotChangeFeed = async () => {
  try {
    await mongoChangeFeedHandler<RouletteJackpot>(
      RouletteJackpotModel,
      async document => {
        if (document.fullDocument) {
          const { jackpotAmount } = document.fullDocument
          const featureFlag = await getFeatureFlag('housegames:roulette')
          if (featureFlag?.state === 'final') {
            emitSocketEventForGame('roulette', 'rouletteJackpotUpdated', {
              jackpotAmount,
            })
          } else {
            const usersIdsWithFeatureFlag = await getBetaUserIdsWithFeatureFlag(
              'housegames:roulette',
            )
            usersIdsWithFeatureFlag.forEach(userId => {
              emitSocketEventForGameForUser(
                'roulette',
                userId,
                'rouletteJackpotUpdated',
                { jackpotAmount },
              )
            })
          }
        }
      },
    )
  } catch (error) {
    rouletteLogger('rouletteJackpotChangeFeed', { userId: null }).error(
      'There was an error in the roulette jackpot change feed',
      {},
      error,
    )
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'roulette_jackpot',
  feeds: [rouletteJackpotChangeFeed],
}
