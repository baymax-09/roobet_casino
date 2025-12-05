import { type FilterQuery, type UpdatePayload, type SortOrder } from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

export interface RoowardsReload {
  _id?: string
  userId: string
  /**
   * interval determines how often the reload can be claimed in seconds
   * e.g. If set to 86400 (24 hours in seconds), the reload can be claimed 24 hours apart
   */
  interval: number
  totalClaims: number
  maxClaims: number
  /** The form on ACP doesn't allow for selection */
  currency: 'crypto'
  amount: number
  expiresAt: Date
  lastClaimedAt: Date
  issuerId?: string
}

const RoowardsReloadSchema = new mongoose.Schema<RoowardsReload>(
  {
    userId: { type: String, index: true },
    interval: Number,
    totalClaims: Number,
    maxClaims: Number,
    currency: String,
    amount: Number,
    expiresAt: Date,
    lastClaimedAt: { type: Date, default: null },
    issuerId: String,
  },
  { timestamps: true },
)

const RoowardsReloadModel = mongoose.model<RoowardsReload>(
  'roowards_reloads',
  RoowardsReloadSchema,
)

export const getRoowardsReload = async (id: string, userId: string) =>
  await RoowardsReloadModel.findOne({
    _id: id,
    userId,
  }).lean()

export const getUserFacingRoowardsReload = async (userId: string) =>
  await RoowardsReloadModel.findOne({
    userId,
    expiresAt: { $gte: Date.now() },
    $where: 'this.totalClaims < this.maxClaims',
  })
    .select('amount interval lastClaimedAt expiresAt totalClaims maxClaims')
    .lean()

export const updateRoowardsReloadForUser = async (
  userId: string,
  payload: UpdatePayload<RoowardsReload>,
) =>
  await RoowardsReloadModel.findOneAndUpdate({ userId }, payload, {
    upsert: true,
    new: true,
  }).lean()

export const incrementReloadUses = async (id: string, lastClaimedAt: Date) =>
  await RoowardsReloadModel.findOneAndUpdate(
    { _id: id },
    {
      lastClaimedAt,
      $inc: {
        totalClaims: 1,
      },
    },
    { new: true },
  ).lean()

export const removeReload = async (id: string) =>
  await RoowardsReloadModel.findByIdAndDelete(id)

export const countReloads = async (id: string) =>
  await RoowardsReloadModel.countDocuments({
    _id: id,
  }).exec()

export const countReloadsForUser = async (userId: string) =>
  await RoowardsReloadModel.countDocuments({
    $expr: {
      $and: [
        { $eq: ['$userId', userId] },
        { $gte: ['$expiresAt', new Date()] },
        { $lt: ['$totalClaims', '$maxClaims'] },
      ],
    },
  }).exec()

export const getReloadHistory = (
  filter: FilterQuery<RoowardsReload>,
  sort: Record<string, SortOrder>,
) =>
  RoowardsReloadModel.find({ ...filter, expiresAt: { $gte: Date.now() } }).sort(
    sort,
  )

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: RoowardsReloadModel.collection.name,
}
