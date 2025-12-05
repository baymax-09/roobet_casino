import { type UpdatePayload } from 'mongoose'
import leanVirtuals from 'mongoose-lean-virtuals'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { type Currency } from 'src/modules/currency/types'
import { subtractTime, addTimeInDuration } from 'src/util/helpers/time'

import { isActive } from '../lib'

export interface Koth {
  /** @todo this is actually an ObjectId */
  _id: string
  startTime: Date
  endTime: Date
  currentUserId: string
  earnings: number
  currency: Currency
  multiplier: number
  createdAt?: string
  updatedAt?: string
  whichRoo: 'astro' | 'king'
  minBet: number
  isActive: boolean
}

export type CreateKOTHRequest = Pick<
  Koth,
  'startTime' | 'endTime' | 'whichRoo' | 'minBet'
>

const KOTHSchema = new mongoose.Schema<Koth>(
  {
    startTime: Date,
    endTime: Date,
    currentUserId: String,
    earnings: Number,
    // temporary default value
    currency: { type: String, default: 'usd' },
    multiplier: { type: Number, default: 0 },
    whichRoo: String,
    minBet: Number,
  },
  { timestamps: true },
)

KOTHSchema.virtual('isActive').get(function (this: Koth) {
  return isActive(this.startTime, this.endTime)
})

KOTHSchema.plugin(leanVirtuals)

const KOTHModel = mongoose.model<Koth>('koths', KOTHSchema)

export async function createKOTH(data: CreateKOTHRequest) {
  const createdKOTH = await KOTHModel.create(data)
  return createdKOTH
}

export async function updateKothById(
  id: string,
  update: UpdatePayload<CreateKOTHRequest>,
): Promise<Koth | null> {
  return await KOTHModel.findByIdAndUpdate(
    { _id: id },
    { ...update },
    { new: true },
  )
}

export async function getLatest(): Promise<Koth | null> {
  return await KOTHModel.findOne({}, null, { sort: { endTime: -1 } }).lean({
    virtuals: true,
  })
}

export async function getMostRecentKOTH(): Promise<Koth | null> {
  const now = Date.now()
  const mostRecentKOTH = await KOTHModel.findOne({
    startTime: { $lte: now },
  })
    .sort({ startTime: -1 })
    .lean({ virtuals: true })
  return mostRecentKOTH || null
}

export async function getLooming(): Promise<Koth | null> {
  const loomingKOTH = await KOTHModel.findOne({
    startTime: { $lte: addTimeInDuration(2, 'hours') },
    endTime: { $gte: subtractTime(2, 'hours') },
  }).lean({ virtuals: true })
  return loomingKOTH
}

export async function getActive(): Promise<Koth | null> {
  return await KOTHModel.findOne({
    startTime: { $lte: new Date() },
    endTime: { $gte: new Date() },
  }).lean({ virtuals: true })
}

export async function getAllKOTHs(): Promise<Koth[]> {
  return await KOTHModel.find({}).lean({ virtuals: true })
}

export async function getKOTHById(id: string): Promise<Koth | null> {
  return await KOTHModel.findOne({ _id: id }).lean({ virtuals: true })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: KOTHModel.collection.name,
}
