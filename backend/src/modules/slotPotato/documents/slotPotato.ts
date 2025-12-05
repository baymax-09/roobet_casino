import leanVirtuals from 'mongoose-lean-virtuals'
import { Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { isActive } from '../util'

export interface SlotPotato {
  _id: Types.ObjectId
  startDateTime: Date
  gameDuration: number
  disabled: boolean
  games: SlotPotatoGame[]
  isActive: boolean
  startEventId?: string
}

export interface SlotPotatoGame {
  gameId: Types.ObjectId
  order: number
}

const SlotPotatoSchema = new mongoose.Schema<SlotPotato>(
  {
    games: [
      {
        gameId: { type: String, index: true },
        order: { type: Number, default: 0 },
      },
    ],
    startDateTime: { type: Date, index: true },
    gameDuration: { type: Number },
    startEventId: { type: String },
    disabled: { type: Boolean },
  },
  { timestamps: true },
)

SlotPotatoSchema.virtual('isActive').get(function (this: SlotPotato) {
  return isActive(this)
})

SlotPotatoSchema.plugin(leanVirtuals)

const SlotPotatoModel = mongoose.model<SlotPotato>(
  'slot_potatoes',
  SlotPotatoSchema,
)

// PO-TAY-TOES
export const getSlotPotatoes = async (): Promise<SlotPotato[]> => {
  return await SlotPotatoModel.find({}).lean<SlotPotato[]>({ virtuals: true })
}

export const getUpcomingSlotPotatoes = async (): Promise<SlotPotato[]> => {
  return await SlotPotatoModel.find({
    startDateTime: { $gte: new Date() },
  }).lean<SlotPotato[]>({ virtuals: true })
}

export const getActiveSlotPotato = async (): Promise<SlotPotato | null> => {
  const slotPotatoes = await SlotPotatoModel.find({ disabled: false }).lean<
    SlotPotato[]
  >({ virtuals: true })
  return slotPotatoes.find((potato: SlotPotato) => potato.isActive) || null
}

export const getSlotPotato = async (id: string | Types.ObjectId) => {
  return await SlotPotatoModel.findOne({
    _id: new Types.ObjectId(id),
  }).lean<SlotPotato>({ virtuals: true })
}

export const createSlotPotato = async (
  data: Omit<SlotPotato, '_id' | 'isActive' | 'startEventId' | 'endEventId'>,
): Promise<SlotPotato> => {
  const slotPotato = await SlotPotatoModel.create(data)
  return await slotPotato.toObject({ virtuals: true })
}

export const updateSlotPotato = async (
  id: string | Types.ObjectId,
  data: Partial<SlotPotato>,
): Promise<SlotPotato | null> => {
  return await SlotPotatoModel.findOneAndUpdate(
    { _id: new Types.ObjectId(id) },
    data,
    { new: true },
  ).lean<SlotPotato>({
    virtuals: true,
  })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: SlotPotatoModel.collection.name,
}
