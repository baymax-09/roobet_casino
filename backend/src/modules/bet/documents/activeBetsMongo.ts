/**
 * @file This model is a generalized MongoDB collection for tracking
 * active bet records for third-party game providers.
 *
 * This should be used for all new third-party providers, and
 * eventually replace the provider-specific collections entirely.
 *
 * At the time of writing, the only provider using this collection
 * and associated interfaces in Slotegrator.
 */
import { type FilterQuery, type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { type Currency } from 'src/modules/currency/types'
import { type BalanceType } from 'src/modules/user/types'
import { mongoChangeFeedHandler } from 'src/util/mongo'
import { getUserById } from 'src/modules/user'
import { publishUserSportsbookBetToFastTrack } from 'src/vendors/fasttrack'
import { betLogger } from '../lib/logger'

export interface ActiveBet {
  _id: Types.ObjectId
  externalIdentifier: string
  externalSessionId?: string
  userId: string
  hidden: boolean
  incognito: boolean
  state: string
  currency: Currency

  // These fields are optional to support handling events out of order.
  gameIdentifier?: string
  amount?: number
  highroller?: boolean
  meta?: Record<string, any>
  closedOut?: Date
  selectedBalanceType?: BalanceType
}

const ActiveBetSchema = new mongoose.Schema<ActiveBet>(
  {
    // Required.
    externalIdentifier: { type: String, required: true },
    userId: { type: String, required: true },
    hidden: { type: Boolean, required: true },
    incognito: { type: Boolean, required: true },
    state: { type: String, required: true },
    // temporary default value
    currency: { type: String, default: 'usd' },
    // Optional.
    externalSessionId: { type: String },
    gameIdentifier: { type: String },
    closedOut: { type: Date, expires: '3d' },
    highroller: { type: Boolean },
    amount: { type: Number },
    selectedBalanceType: { type: String },
    meta: { type: Object },
  },
  { timestamps: true },
)

ActiveBetSchema.index({ externalIdentifier: 1 }, { unique: true })
ActiveBetSchema.index({
  externalSessionId: 1,
  userId: 1,
  selectedBalanceType: 1,
})
ActiveBetSchema.index({ gameIdentifier: 1, userId: 1, closedOut: 1 })

const ActiveBetModel = mongoose.model<ActiveBet>('active_bets', ActiveBetSchema)

export const getOrCreateActiveBet = async (
  payload: Partial<Omit<ActiveBet, '_id'>> &
    Pick<ActiveBet, 'externalIdentifier' | 'userId'>,
): Promise<ActiveBet> => {
  const existing = await getActiveBet({
    externalIdentifier: payload.externalIdentifier,
  })

  if (existing) {
    return existing
  }

  return await createActiveBet({
    ...payload,
    hidden: payload.hidden ?? false,
    incognito: payload.incognito ?? false,
    state: payload.state ?? 'waiting',
    // temporary default value
    currency: 'usd',
  })
}

export const getActiveBetMongoById = async (
  id: string,
): Promise<ActiveBet | undefined> => {
  return (await ActiveBetModel.findById(id).lean()) ?? undefined
}

export const getActiveBet = async (
  filter: Partial<ActiveBet>,
): Promise<ActiveBet | undefined> => {
  return (await ActiveBetModel.findOne(filter).lean()) ?? undefined
}

export const getActiveBets = async (
  filter: FilterQuery<ActiveBet>,
): Promise<ActiveBet[]> => {
  return (await ActiveBetModel.find(filter).lean()) ?? undefined
}

export const createActiveBet = async (
  activeBet: Omit<ActiveBet, '_id'>,
): Promise<ActiveBet> => {
  return await ActiveBetModel.create(activeBet)
}

export const updateActiveBet = async (
  id: Types.ObjectId,
  payload: Partial<Omit<ActiveBet, '_id'>>,
): Promise<ActiveBet | null> => {
  return await ActiveBetModel.findOneAndUpdate({ _id: id }, payload).lean()
}

export const updateOpenActiveBet = async (
  id: Types.ObjectId,
  payload: Partial<Omit<ActiveBet, '_id'>>,
): Promise<ActiveBet | null> => {
  return await ActiveBetModel.findOneAndUpdate(
    { _id: id, closedOut: { $exists: false } },
    payload,
  ).lean()
}

export const deleteActiveBet = async (
  id: Types.ObjectId,
): Promise<ActiveBet | null> => {
  return await ActiveBetModel.findOneAndDelete({ _id: id })
}

/* FEEDS */
const activeBetsMongoChangeFeed = async () => {
  let logUserId
  let logGameIdentifier
  try {
    await mongoChangeFeedHandler<ActiveBet>(ActiveBetModel, async document => {
      if (document.fullDocument) {
        const { userId, gameIdentifier } = document.fullDocument

        logUserId = userId
        logGameIdentifier = gameIdentifier

        if (gameIdentifier === 'slotegrator:sportsbook-1') {
          const user = await getUserById(userId)

          if (user) {
            // Publish message to RabbitMQ that a sSlotegrator action has taken place
            publishUserSportsbookBetToFastTrack({
              activeBet: document.fullDocument,
              rollback: false,
            })
          }
        }
      }
    })
  } catch (error) {
    betLogger('activeBetsMongoChangeFeed', { userId: logUserId ?? null }).error(
      'change feed failed to process document',
      {
        gameIdentifier: logGameIdentifier,
      },
      error,
    )
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: ActiveBetModel.collection.name,
  feeds: [activeBetsMongoChangeFeed],
}
