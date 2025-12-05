import { type FilterQuery, type Types } from 'mongoose'
import leanVirtuals from 'mongoose-lean-virtuals'

import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'
import { timeIsBetween } from 'src/util/helpers/time'
import { type FreespinIssuer } from 'src/modules/tp-games'

const SLOTEGRATOR_BONUS_TYPES = ['freebet', 'comboboost'] as const

export type SlotegratorBonusType = (typeof SLOTEGRATOR_BONUS_TYPES)[number]

export interface SlotegratorBonus {
  _id: Types.ObjectId
  userId: string
  slotegratorId: number
  // ID that Betby stores and returns with bet requests.
  externalId: string
  templateId: number
  type: SlotegratorBonusType
  activated: boolean
  activeFrom: Date
  activeTo: Date
  amount?: number
  createdAt: Date
  updatedAt: Date
  settled?: boolean
  status?: string
  issuerId: FreespinIssuer
  reason: string
}

type SlotegratorBonusPayload = Omit<
  SlotegratorBonus,
  '_id' | 'createdAt' | 'updatedAt'
>

const SlotegratorBonusesSchema = new mongoose.Schema<SlotegratorBonus>(
  {
    userId: { type: String, required: true },
    slotegratorId: { type: Number, required: true },
    externalId: { type: String, required: true },
    templateId: { type: Number, required: true },
    type: { type: String, enum: SLOTEGRATOR_BONUS_TYPES, required: true },
    activeFrom: { type: Date, required: true },
    activeTo: { type: Date, required: true },
    activated: { type: Boolean, required: true, default: false },
    amount: { type: Number },
    settled: { type: Number },
    issuerId: { type: String },
    reason: { type: String },
  },
  { timestamps: true },
)

SlotegratorBonusesSchema.virtual('status').get(function (
  this: SlotegratorBonus,
) {
  return getBonusStatus(this)
})

SlotegratorBonusesSchema.plugin(leanVirtuals)

export const SlotegratorBonusesModel = mongoose.model<SlotegratorBonus>(
  'slotegrator_bonuses',
  SlotegratorBonusesSchema,
)

export function getBonusStatus(bonus: SlotegratorBonus): string {
  if (bonus.activated) {
    return bonus.settled ? 'finished' : 'used'
  }

  const isCurrentlyActive = timeIsBetween(
    new Date(),
    bonus.createdAt,
    bonus.activeTo,
  )

  return isCurrentlyActive ? 'active' : 'expired'
}

export const getBonusById = async (
  id: Types.ObjectId,
): Promise<SlotegratorBonus | undefined> => {
  return (
    (await SlotegratorBonusesModel.findOne({ _id: id }).lean({
      virtuals: true,
    })) ?? undefined
  )
}

export const getBonuses = async (
  filter: FilterQuery<SlotegratorBonus>,
): Promise<SlotegratorBonus[]> => {
  return await SlotegratorBonusesModel.find(filter).lean({ virtuals: true })
}

export const createBonus = async (
  payload: Omit<SlotegratorBonusPayload, 'activated'>,
): Promise<SlotegratorBonus> => {
  return await (
    await SlotegratorBonusesModel.create({ ...payload, activated: false })
  ).toObject()
}

export const updateBonusByExternalId = async (
  externalId: string,
  payload: Partial<SlotegratorBonusPayload>,
): Promise<SlotegratorBonus | undefined> => {
  return (
    (await SlotegratorBonusesModel.findOneAndUpdate(
      { externalId },
      payload,
    ).lean()) ?? undefined
  )
}

export const deleteBonus = async (id: Types.ObjectId): Promise<void> => {
  await SlotegratorBonusesModel.deleteOne({ _id: id })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: SlotegratorBonusesModel.collection.name,
}
