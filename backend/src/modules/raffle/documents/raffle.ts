import leanVirtuals from 'mongoose-lean-virtuals'
import { type FilterQuery, type UpdateQuery, type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import {
  type RaffleTypes,
  type RaffleModifierType,
  RaffleModifierTypes,
  raffleTypesEnum,
} from '../lib/types'

interface RaffleModifierIdentifier {
  id: string
  title: string
}

interface RaffleModifier {
  identifiers: RaffleModifierIdentifier[]
  ticketsPerDollar: number
  type: RaffleModifierType
}

const RaffleModifierSchema = new mongoose.Schema<RaffleModifier>({
  identifiers: { type: [{ id: String, title: String }], default: [] },
  ticketsPerDollar: { type: Number, required: true },
  type: { type: String, required: true, enum: RaffleModifierTypes },
})

export interface Raffle {
  _id: Types.ObjectId
  id: string
  type: RaffleTypes
  start: string
  end: string
  name: string
  slug: string
  amount: number
  winnerCount: number
  isActive: boolean
  archived: boolean
  ticketsPerDollar: number
  baseDollarAmount: number
  payouts: string[]
  bannerImage: string
  featureImage: string
  heroImage: string
  modifiers?: RaffleModifier[]
  config: {
    dailyGame?: {
      identifier: string
      url: string
    }
  }
  winners: string[] | null
  winnersRevealed: boolean
  updatedAt?: Date
  createdAt?: Date
}

const RaffleSchema = new mongoose.Schema<Raffle>(
  {
    type: { type: String, enum: raffleTypesEnum, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    amount: { type: Number, required: true },
    winnerCount: { type: Number, required: true },
    winners: { type: [String], required: true, default: [] },
    winnersRevealed: { type: Boolean, required: true, default: false },
    archived: { type: Boolean, required: true, default: false },
    ticketsPerDollar: { type: Number, required: true },
    baseDollarAmount: { type: Number, required: true },
    payouts: { type: [String], required: true },
    modifiers: { type: [RaffleModifierSchema] },
    bannerImage: { type: String, required: true },
    featureImage: { type: String, required: true },
    heroImage: { type: String, required: true },
    config: {
      type: {
        dailyGame: {
          identifier: { type: String },
          url: { type: String },
        },
      },
      required: true,
    },
  },
  { timestamps: true },
)

RaffleSchema.index({ slug: 1 }, { unique: true })

RaffleSchema.virtual('isActive').get(function (this: Raffle) {
  const now = new Date().toISOString()
  return now < this.end && now > this.start
})

// Enable virtuals on lean queries.
RaffleSchema.plugin(leanVirtuals)

const RaffleModel = mongoose.model<Raffle>('raffle_v2', RaffleSchema)

export const getActiveRaffles = async () => {
  const now = new Date().toISOString()
  return await RaffleModel.find({
    archived: { $ne: true },
    winners: { $size: 0 },
    start: { $lt: now },
    end: { $gt: now },
  }).lean<Raffle[]>()
}

export const getRaffles = async () => {
  const now = new Date().toISOString()
  return await RaffleModel.find({
    archived: { $ne: true },
    start: { $lte: now },
  }).lean<Raffle[]>({ virtuals: true })
}

export const getAllRaffles = async () => {
  return await RaffleModel.find({}).lean({ virtuals: true })
}

export const getRaffle = async (raffleIdOrSlug?: string | null) => {
  const conditions: Array<FilterQuery<Raffle>> = [{ slug: raffleIdOrSlug }]

  if (raffleIdOrSlug && mongoose.Types.ObjectId.isValid(raffleIdOrSlug)) {
    conditions.push({ _id: raffleIdOrSlug })
  }

  return await RaffleModel.findOne({
    $or: conditions,
  }).lean({ virtuals: true })
}

export const upsertRaffle = async (doc: UpdateQuery<Raffle>) => {
  const { _id, ...updates } = doc

  const id = { _id: _id ?? new mongoose.Types.ObjectId().toString() }

  return await RaffleModel.findOneAndUpdate(id, updates, {
    upsert: true,
    new: true,
  }).lean({ virtuals: true })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'raffle_v2',
}
