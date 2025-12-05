import { type ObjectId } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'

export interface UserGameCurrency {
  userId: string
  gameIdentifier: string
  currency: DisplayCurrency
}
type DBUserGameCurrency = {
  _id: ObjectId
  createdAt: Date
  updatedAt: Date
} & UserGameCurrency

interface UpdateUserGameCurrencyArgs {
  userId: UserGameCurrency['userId']
  gameIdentifier: UserGameCurrency['gameIdentifier']
  currency?: UserGameCurrency['currency']
}

interface GetUserGameCurrencyArgs {
  userId: UserGameCurrency['userId']
  gameIdentifier: UserGameCurrency['gameIdentifier']
}

const UserGameCurrencySchema = new mongoose.Schema<UserGameCurrency>(
  {
    userId: { type: String, required: true },
    gameIdentifier: { type: String, required: true },
    currency: { type: String, default: 'usd' },
  },
  { timestamps: true },
)

UserGameCurrencySchema.index({ createdAt: 1 }, { expires: '1d' })
UserGameCurrencySchema.index({ userId: 1, gameIdentifier: 1 }, { unique: true })

const UserGameCurrencyModel = mongoose.model<UserGameCurrency>(
  'user_game_currencies',
  UserGameCurrencySchema,
)

export const getUserGameCurrency = async ({
  userId,
  gameIdentifier,
}: GetUserGameCurrencyArgs): Promise<UserGameCurrency | null> => {
  return await UserGameCurrencyModel.findOne({
    userId,
    gameIdentifier,
  }).lean<DBUserGameCurrency>()
}

export const updateUserGameCurrency = async ({
  userId,
  gameIdentifier,
  currency,
}: UpdateUserGameCurrencyArgs): Promise<DBUserGameCurrency | null> => {
  return await UserGameCurrencyModel.findOneAndUpdate(
    { userId, gameIdentifier },
    { userId, gameIdentifier, currency },
    { new: true, upsert: true },
  ).lean<DBUserGameCurrency>()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: UserGameCurrencyModel.collection.name,
}
