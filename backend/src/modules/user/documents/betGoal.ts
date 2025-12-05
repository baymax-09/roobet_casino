import { type SchemaDefinitionProperty } from 'mongoose'

import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { PortfolioBalanceTypes, type PortfolioBalanceType } from '../types'

export type PortfolioBetGoal = Partial<
  Record<PortfolioBalanceType, number | null>
>
interface BetGoal extends PortfolioBetGoal {
  userId: string
}

interface UpdateBetGoalArgs {
  userId: string
  balanceType: PortfolioBalanceType
  amount: number
}

interface ResetBetGoalArgs {
  userId: string
  balanceType: PortfolioBalanceType
}

interface GetCreateBetGoalArgs {
  userId: string
}

const portfolioBetGoals = PortfolioBalanceTypes.reduce(
  (acc, portfolioBalanceType) => ({
    ...acc,
    [portfolioBalanceType]: { type: Number, default: 0, min: 0 },
  }),
  {},
) as Record<PortfolioBalanceType, SchemaDefinitionProperty<number>>

export const BetGoalSchema = new megaloMongo.Schema<BetGoal>(
  {
    userId: { type: String, index: true },
    ...portfolioBetGoals,
  },
  { timestamps: true },
)

const BetGoalModel = megaloMongo.model<BetGoal>('bet_goals', BetGoalSchema)

export const incrementBetGoal = async ({
  userId,
  balanceType,
  amount,
}: UpdateBetGoalArgs) => {
  const update = {
    $inc: {
      [balanceType]: amount,
    },
  }
  return await BetGoalModel.findOneAndUpdate({ userId }, update, {
    new: true,
    upsert: true,
  }).lean<BetGoal>()
}

export const decrementBetGoal = async ({
  userId,
  balanceType,
  amount,
}: UpdateBetGoalArgs) => {
  // Assures no negative values in bet goals
  const update = {
    $set: {
      [balanceType]: {
        $cond: [
          {
            $gt: [
              {
                $subtract: ['$' + balanceType, Math.abs(amount)],
              },
              0,
            ],
          },
          {
            $subtract: ['$' + balanceType, Math.abs(amount)],
          },
          0,
        ],
      },
    },
  }

  return await BetGoalModel.findOneAndUpdate({ userId }, [update], {
    new: true,
    upsert: true,
  }).lean<BetGoal>()
}

export const resetBetGoal = async ({
  userId,
  balanceType,
}: ResetBetGoalArgs) => {
  const update = {
    $set: {
      [balanceType]: 0,
    },
  }
  return await BetGoalModel.findOneAndUpdate({ userId }, update, {
    new: true,
    upsert: true,
  }).lean<BetGoal>()
}

export const getBetGoal = async ({ userId }: GetCreateBetGoalArgs) => {
  return await BetGoalModel.findOne({ userId }).lean<BetGoal | null>()
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: BetGoalModel.collection.name,
}
