import { type UpdatePayload } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { type Currency } from 'src/modules/currency/types'

export interface KothEarnings {
  userId: string
  kothId: string
  earnings: number
  currency: Currency
  gameName: string
  gameMult: number
  gameImage?: string | null
  gameIdentifier?: string | null
  createdAt?: string
  updatedAt?: string
}

const KOTHEarningsSchema = new mongoose.Schema<KothEarnings>(
  {
    userId: String,
    kothId: { type: String, index: true },
    earnings: { type: Number, index: true },
    // temporary default value
    currency: { type: String, default: 'usd' },
    gameName: String,
    gameMult: Number,
    gameImage: String,
    gameIdentifier: String,
  },
  { timestamps: true },
)

const KOTHEarningsModel = mongoose.model<KothEarnings>(
  'koth_earnings',
  KOTHEarningsSchema,
)

export async function getTopKingsForKothId(
  kothId: string,
  limit = 10,
): Promise<KothEarnings[]> {
  return await KOTHEarningsModel.find({ kothId }, null, {
    sort: { earnings: -1 },
    limit,
  }).lean()
}

export async function getKingForKothId(
  kothId: string,
  userId: string,
): Promise<KothEarnings | null> {
  return await KOTHEarningsModel.findOne({ kothId, userId }).lean()
}

export async function updateKingForKothId(
  kothId: string,
  userId: string,
  update: UpdatePayload<KothEarnings>,
): Promise<KothEarnings | null> {
  return await KOTHEarningsModel.findOneAndUpdate({ kothId, userId }, update, {
    new: true,
    upsert: true,
  }).lean()
}

export async function deleteKOTHEarnings(kothId: string) {
  return await KOTHEarningsModel.deleteMany({ kothId })
}

export async function addEarnings(
  kothId: string,
  userId: string,
  earnings: number,
): Promise<KothEarnings> {
  return await KOTHEarningsModel.findOneAndUpdate(
    { kothId, userId },
    { $inc: { earnings } },
    { upsert: true, new: true },
  )
}

export const getKOTHEarningsForUser = async (userId: string) => {
  const latestEarnings = await KOTHEarningsModel.findOne({ userId })
    .sort({ createdAt: -1 })
    .lean()

  const lifetimeEarningsAggregate = await KOTHEarningsModel.aggregate([
    { $match: { userId } },
    { $group: { _id: null, lifeTime: { $sum: '$earnings' } } },
  ])

  const lifeTime =
    lifetimeEarningsAggregate.length > 0
      ? lifetimeEarningsAggregate[0].lifeTime
      : 0

  return {
    lifeTime,
    latest: latestEarnings ? latestEarnings.earnings : 0,
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: KOTHEarningsModel.collection.name,
}
