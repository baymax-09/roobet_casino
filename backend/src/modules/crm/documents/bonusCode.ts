import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { ThirdParties } from 'src/modules/bet/types'

import {
  BonusCodeTypeValues,
  type BonusCodeType,
  type BonusCodeTypeSettings,
} from '../types'

export interface BonusCode {
  _id: Types.ObjectId
  name: string
  description: string
  type: BonusCodeType
  typeSettings: BonusCodeTypeSettings
}

type BonusCodeOmitIdArgs = Omit<BonusCode, '_id'>

function requiredFreeSpinsType(this: BonusCode) {
  return this.type === 'FREESPINS'
}

const BonusCodeSchema = new mongoose.Schema<BonusCode>(
  {
    name: { type: String, required: true, index: true, unique: true },
    description: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: BonusCodeTypeValues,
      index: true,
    },
    typeSettings: {
      amount: {
        type: Number,
        required: [
          requiredFreeSpinsType,
          'amount is required if type is FREESPINS.',
        ],
      },
      rounds: {
        type: Number,
        required: [
          requiredFreeSpinsType,
          'rounds is required if type is FREESPINS.',
        ],
      },
      gameIdentifier: {
        type: String,
        required: [
          requiredFreeSpinsType,
          'gameIdentifier is required if type is FREESPINS.',
        ],
      },
      tpGameAggregator: {
        type: String,
        enum: ThirdParties,
        required: [
          requiredFreeSpinsType,
          'tpGameAggregator is required if type is FREESPINS.',
        ],
      },
    },
  },
  { timestamps: true },
)

const BonusCodeModel = mongoose.model<BonusCode>('bonusCodes', BonusCodeSchema)

export const getAllBonusCodes = async () => {
  return await BonusCodeModel.find({}).lean<BonusCode[]>()
}

export const getBonusCodeById = async (id: string) => {
  return await BonusCodeModel.findById(id).lean<BonusCode | null>()
}

export const getBonusCodeByName = async (name: string) => {
  return await BonusCodeModel.findOne({ name }).lean<BonusCode | null>()
}

export const createBonusCode = async (payload: BonusCodeOmitIdArgs) => {
  return (await BonusCodeModel.create(payload)).toObject<BonusCode>()
}

export const updateBonusCode = async (
  _id: string,
  payload: BonusCodeOmitIdArgs,
) => {
  return await BonusCodeModel.findOneAndUpdate({ _id }, payload, {
    new: true,
    upsert: true,
  }).lean<BonusCode>()
}

export const deleteBonusCode = async (_id: string) => {
  return await BonusCodeModel.findOneAndDelete({ _id }).lean<BonusCode>()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: BonusCodeModel.collection.name,
  indices: [{ name: 'name' }, { name: 'type' }],
}
