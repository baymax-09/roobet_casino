import { megaloMongo, io } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { mongoChangeFeedHandler } from 'src/util/mongo'
import { publishUserBalanceUpdateMessageToFastTrack } from 'src/vendors/fasttrack'
import { type BalanceUpdate } from 'src/vendors/fasttrack/types'
import { getUserFiatCurrency } from 'src/modules/currency/types'

import {
  type UserPortfolio,
  type PortfolioBalanceType,
  type PortfolioBalance,
  PortfolioBalanceTypes,
} from '../types'
import { userLogger } from '../lib/logger'

interface UserPortfolioFilter {
  userId: string
}

interface UserPortfolioBalanceFilter {
  userId: string
  type: PortfolioBalanceType
}

interface UserPortfolioBalanceUpdateArgs {
  userId: string
  type: PortfolioBalanceType
  amount: number
}

interface GetPortfolioBalance {
  userId: string
  balanceType: PortfolioBalanceType
}

interface AdminUpdateActivePortfolioBalanceArgs {
  userId: string
  amount: number
  balanceTypeOverride: PortfolioBalanceType
}

export const UserPortfolioBalanceSchema = new megaloMongo.Schema<
  Record<PortfolioBalanceType, PortfolioBalance>
>({
  usdt: {
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'usd' },
  },
  usdc: {
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'usd' },
  },
  xrp: {
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'usd' },
  },
  doge: {
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'usd' },
  },
  trx: {
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'usd' },
  },
})

export const UserPortfolioSchema = new megaloMongo.Schema<UserPortfolio>(
  {
    userId: { type: String, required: true, index: true, unique: true },
    balances: { type: UserPortfolioBalanceSchema },
  },
  { timestamps: true },
)

const UserPortfolioModel = megaloMongo.model<UserPortfolio>(
  'user_altcoin_portfolios',
  UserPortfolioSchema,
)

/* CREATE */
export async function getOrCreatePortfolio({
  userId,
}: UserPortfolioFilter): Promise<UserPortfolio> {
  const portfolio = await getPortfolio({ userId })

  if (portfolio) {
    return portfolio
  }

  const newPortfolios = await UserPortfolioModel.create([{ userId }])
  // Mongoose requires an array in creates to use sessions... who knows why.
  return newPortfolios[0]
}

/* READ */
export async function getPortfolio({
  userId,
}: UserPortfolioFilter): Promise<UserPortfolio | null> {
  const portfolio = await UserPortfolioModel.findOne({
    userId,
  }).lean<UserPortfolio>()
  return portfolio
}

export const getPortfolioBalance = async ({
  userId,
  balanceType,
}: GetPortfolioBalance) => {
  const portfolio = await UserPortfolioModel.findOne({ userId })
  return portfolio && portfolio.balances
    ? portfolio.balances[balanceType]
    : null
}

export async function getBalance({
  userId,
  type,
}: UserPortfolioBalanceFilter): Promise<PortfolioBalance | null> {
  const portfolio = await getOrCreatePortfolio({ userId })
  // Try to find the specified balance. Otherwise, return null.
  return portfolio && portfolio.balances ? portfolio.balances[type] : null
}

/* UPDATE */
export async function incrementPortfolioBalance({
  userId,
  type,
  amount: rawAmount,
}: UserPortfolioBalanceUpdateArgs): Promise<{
  resultantBalance: number
  previousBalance: undefined
}> {
  // If you think this is bad software design, then shut up.
  const amount = parseFloat(`${rawAmount}`)
  if (isNaN(amount)) {
    throw new Error(`There was an error with the amount for user ${userId}.`)
  }

  const balanceKey = `balances.${type}.balance`
  const currencyKey = `balances.${type}.currency`
  const updatePayload = {
    userId,
    $inc: { [balanceKey]: amount },
    $set: { [currencyKey]: 'usd' },
  }

  const updatedPortfolio = await UserPortfolioModel.findOneAndUpdate(
    { userId },
    updatePayload,
    { new: true, upsert: true },
  ).lean()
  if (
    !updatedPortfolio ||
    !updatedPortfolio.balances ||
    !updatedPortfolio.balances[type]
  ) {
    throw new Error(
      `There was an error updating user portfolio for user ${userId}.`,
    )
  }
  return {
    resultantBalance: updatedPortfolio.balances[type].balance,
    previousBalance: undefined,
  }
}

export const adminUpdatePortfolioBalance = async ({
  userId,
  amount,
  balanceTypeOverride,
}: AdminUpdateActivePortfolioBalanceArgs): Promise<{
  previousBalance: number
  resultantBalance: number
}> => {
  const balanceKey = `balances.${balanceTypeOverride}.balance`
  const currencyKey = `balances.${balanceTypeOverride}.currency`
  const updatePayload = {
    userId,
    $set: { [balanceKey]: amount, [currencyKey]: 'usd' },
  }

  const previousPortfolio = await UserPortfolioModel.findOneAndUpdate(
    { userId },
    updatePayload,
    { upsert: true },
  ).lean()

  const previousBalance =
    previousPortfolio?.balances[balanceTypeOverride]?.balance ?? 0
  return { previousBalance, resultantBalance: amount }
}

/* FEEDS */
const portfolioChangeFeed = async () => {
  let userId = null
  try {
    await mongoChangeFeedHandler<UserPortfolio>(
      UserPortfolioModel,
      async document => {
        const fullDocument = document.fullDocument
        if (fullDocument) {
          userId = fullDocument.userId
          const balances = PortfolioBalanceTypes.map(token => ({
            type: token,
            balance: fullDocument.balances[token]?.balance || 0,
          }))
          const payload = {
            userId,
            balances,
          }
          io.to(userId).emit('userAltcoinPortfolioUpdated', payload)
        }
      },
    )
  } catch (error) {
    userLogger('portfolioChangeFeed', { userId }).error(
      'There was an error in the portfolio change feed',
      error.message,
    )
  }
}

const portfolioBalanceUpdateFeed = async () => {
  let userId = null
  try {
    await mongoChangeFeedHandler<UserPortfolio>(
      UserPortfolioModel,
      async document => {
        if (document.fullDocument) {
          userId = document.fullDocument.userId
          const fullDocument = document.fullDocument

          if (
            document.operationType === 'update' &&
            document.updateDescription.updatedFields
          ) {
            const updatedFields = document.updateDescription.updatedFields
            const balancesMapped: BalanceUpdate[] = [
              {
                amount: 0,
                currency: getUserFiatCurrency(fullDocument.userId),
                key: 'real_money',
                exchange_rate: 1, // Everything stored in USD
              },
              // TODO: We need to take into account bonuses, but for now default to 0
              {
                amount: 0,
                currency: getUserFiatCurrency(fullDocument.userId),
                key: 'bonus_money',
                exchange_rate: 1, // Everything stored in USD
              },
            ]

            // Setting the amount for each balance
            // The updatedFields will look like this:
            // {"balances.usdt.balance":48.2,"updatedAt":"2022-12-16T01:46:18.151Z"}
            Object.keys(updatedFields)
              .filter(key => key.split('.').length >= 3)
              .filter(key => key.split('.')[2] === 'balance')
              .forEach((rawBalanceString: string) => {
                const splitStrings = rawBalanceString.split('.')
                const token = splitStrings[1] as PortfolioBalanceType
                balancesMapped[0].amount = fullDocument.balances[token].balance
              })
            // Publish message to RabbitMQ when one of the user balance fields have changed
            publishUserBalanceUpdateMessageToFastTrack({
              userId,
              balances: balancesMapped,
            })
          }
        }
      },
    )
  } catch (error) {
    userLogger('portfolioBalanceUpdateFeed', { userId }).error(
      `There was an error in the portfolio change feed - ${error.message}`,
      {},
      error,
    )
  }
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: UserPortfolioModel.collection.name,
  feeds: [portfolioChangeFeed, portfolioBalanceUpdateFeed],
}
