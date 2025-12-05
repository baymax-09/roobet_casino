import {
  type ClientSession,
  type FilterQuery,
  type SortOrder,
  type PipelineStage,
} from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { getUserFiatCurrency } from 'src/modules/currency/types'
import { type HouseGameName } from 'src/modules/game/types'
import { type LevelsProgress } from 'src/modules/roowards'
import { writeStatsForTransaction } from 'src/modules/stats/lib/transactions'
import { megaloMongo, io } from 'src/system'
import { publishUserBalanceUpdateMessageToFastTrack } from 'src/vendors/fasttrack'
import { mongoChangeFeedHandler } from 'src/util/mongo'

import {
  type UserBalances,
  getSelectedBalanceFieldFromIdentifier,
  mapBalanceInformation,
  validateAndGetBalanceType,
} from '../balance'
import { getUserById } from '..'
import { type User } from '../types/User'
import {
  isPortfolioBalanceType,
  type BalanceType,
  type PortfolioBalanceType,
} from '../types/Balance'
import { userLogger } from '../lib/logger'

interface TableSearchResult<T> {
  page: number
  limit: number
  count: number
  data: T[]
}

export interface Transaction<T extends TransactionType = TransactionType> {
  _id: string
  /** @deprecated please refer to balanceType and amount */
  currentBalance: number
  /** @deprecated please refer to balanceType and amount */
  currentEthBalance: number
  /** @deprecated please refer to balanceType and amount */
  currentLtcBalance: number
  /** @deprecated please refer to balanceType and amount */
  currentDogeBalance: number
  /** @deprecated please refer to balanceType and amount */
  currentCashBalance: number
  /** @deprecated please refer to balanceType and amount */
  currentAltcoinBalances?: Partial<Record<PortfolioBalanceType, number>>
  userId: string
  amount: number
  type: T
  /**
   * meta is optional because it isn't on all records, but not having one is incorrect for inserts
   * This is why you separate DB and API types ¯\_(ツ)_/¯
   */
  meta?: TransactionMeta[T]
  timestamp: Date // Date or string?
  balanceType: BalanceType
  createdAt?: Date
  updatedAt?: Date
}

/** @deprecated please refer to balanceType and amount */
export type CurrentBalances = Pick<
  Transaction,
  | 'currentCashBalance'
  | 'currentLtcBalance'
  | 'currentBalance'
  | 'currentEthBalance'
  | 'currentAltcoinBalances'
>

export type TransactionType =
  | 'bonus'
  | 'withdrawal'
  | 'rain'
  | 'bet'
  | 'promoBuyin'
  | 'winRollback'
  | 'survey'
  | 'tip'
  // | 'freeBet'
  | 'refund'
  | 'cancelledWithdrawal'
  | 'adminAddBalance'
  | 'adminSetBalance'
  | 'declinedWithdrawal'
  | 'payout'
  | 'roowards'
  | 'deposit'
  | 'promo'
  | 'affiliate'
  | 'marketingBonus'
  | 'matchPromo'
  | 'koth'
  | 'early abort match promo'
  | 'roowardsReload'
  | 'raffle' // TODO used to be `raffle_${string}`, consider backfilling
  | 'roulette_jackpot_win'
  | 'prizeDrop'
  | 'depositBonus'
  | 'emberTransfer'

export type RefundTransactionType = 'refund' | 'reject' | 'cash_out' | null

// TODO: Actually type these...
interface GameIdentifiers {
  aggregator?: string
  gid?: string
  identifier?: string
  gameName?: HouseGameName
}

/**
 * Mostly unnecessary and hopefully will remove most of these over time or split apart bet/payout/refund/rollback
 * and make discriminated unions on `provider`.
 */
interface BasePlayMeta {
  provider: string // TODO used to be `service`, consider backfilling
  /**
   * External game session id, some txn used to have our internal gameSessionId which are transient.
   */
  gameSessionId?: string
  gameIdentifiers: GameIdentifiers
}

interface BetMeta extends BasePlayMeta {
  betId?: string
  providerBetId?: string // Slotegrator Betby betslip id
  externalIdentifier?: string // Slotegrator betslip_id/Hacksaw idempotency token
}

interface PayoutMeta extends BasePlayMeta {
  betId?: string
  activeBetId?: string // Slotegrator activeBetId
  providerBetId?: string // Slotegrator Betby betslip id
  externalIdentifier?: string // Slotegrator betslip id
  betIdentifier?: string // Hacksaw idempotency token
  transactionId?: string | number // Slotegrator/Hacksaw idempotency token
  promo?: true
}

interface RollbackMeta extends BasePlayMeta {
  parentTransactionId?: string | number // Slotegrator/Hacksaw original action idempotency token
  transactionId?: string | number // Slotegrator/Hacksaw idempotency token
  externalIdentifier?: string // Slotegrator betslip_id/Hacksaw idempotency token
  providerBetId?: string // Slotegrator Betby betslip id
}
interface RefundMeta extends BasePlayMeta {
  activeBetId?: string // Slotegrator/Hacksaw internal active bet id
  promo?: true
  transactionId?: number | string // Hacksaw idempotency token
  betIdentifier?: string // Hacksaw idempotency tokens
  reference?: string // Pragmatic idempotency token
  providerBetId?: string // Slotegrator Betby betslip id
  refundType?: RefundTransactionType // Specific refund type for disambiguation. Consider exposing in UX.
}

interface AdminAction {
  reason: string
  adminId: string
}

type Empty = Record<string, never>

export interface TransactionMeta {
  bet: BetMeta
  /** Unfortunately, this transaction type is overloaded but actually queried by the application. */
  bonus: AdminAction | Record<string, any>
  deposit: {
    transactionId?: string
    depositId: string
    confirmationsOnCredit?: number
  }
  freeBet: {
    /** @todo coalesce game identifiers in transactions */
    gameName: string
    betId: string
  }
  payout: PayoutMeta
  winRollback: RollbackMeta
  refund: RefundMeta
  affiliate: {
    betAmount: number
  }
  survey: {
    offerName: string
    ipAddress: string
    network: string
  }
  tip:
    | {
        toName: string
        toId: string
      }
    | {
        fromName: string
        fromId: string
      }
  rain: {
    creator: boolean
  }
  koth: {
    kothId: string
  }
  raffle: {
    raffleId: string
  }
  roowards: {
    type: 'd' | 'w' | 'm'
    amountClaimed: number
    levelsAtClaim: LevelsProgress
    userLossBackUsedForAmount: boolean
    totalLosses: number
    sportsbookLosses: number
    rakebackAmount: number
    userLossback: number
  }
  withdrawal: Empty
  promoBuyin: {
    provider: string
    gameSessionId: string
    gameIdentifiers: GameIdentifiers
  }
  cancelledWithdrawal: Empty
  adminAddBalance: AdminAction
  adminSetBalance: AdminAction
  declinedWithdrawal: Empty
  promo: {
    code: string
  }
  marketingBonus: AdminAction
  matchPromo: {
    /** @todo used to be `promo`, consider backfilling */
    promoId: string
    reason: string
    issuerId: string
  }
  depositBonus: {
    promoId: string
    reason: string
    issuerId: string
  }
  'early abort match promo': Empty
  roowardsReload: {
    issuerId: string
  }
  roulette_jackpot_win: {
    betId: string
    gameId: string
  }
  prizeDrop: PayoutMeta
  emberTransfer: {
    emberUserId: string
  }
}

export interface CreateTransaction<Type extends TransactionType> {
  user: User
  amount: number
  transactionType: Type
  meta: TransactionMeta[Type]
  balanceType: BalanceType
  session?: ClientSession
  /** Allow consumer to provide the resultant balance to prevent concurrency issues. */
  resultantBalance: number
  /** The timestamp when the balance should update on the client. Used for delayed balance updates, e.g., waiting for an animation to complete. */
  balanceUpdateTimestamp?: Date
}

const TransactionMongoSchema = new megaloMongo.Schema<Transaction>(
  {
    /** @deprecated please refer to balanceType and amount */
    currentBalance: Number,
    /** @deprecated please refer to balanceType and amount */
    currentEthBalance: Number,
    /** @deprecated please refer to balanceType and amount */
    currentLtcBalance: Number,
    /** @deprecated please refer to balanceType and amount */
    currentDogeBalance: Number,
    /** @deprecated please refer to balanceType and amount */
    currentCashBalance: Number,
    /** @deprecated please refer to balanceType and amount */
    currentAltcoinBalances: {
      type: Map,
      of: Number,
    },
    userId: { type: String, index: true },
    amount: Number,
    type: String,
    meta: {},
    balanceType: { type: String },
    // TODO: can this be removed?
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

TransactionMongoSchema.index({ updatedAt: 1 }, { sparse: true })

TransactionMongoSchema.post('init', function (doc) {
  this.set(
    'balanceType',
    validateAndGetBalanceType({ balanceIdentifier: doc.balanceType }),
  )
})

/** @todo stop exporting me */
export const TransactionModel = megaloMongo.model<Transaction>(
  'transactions',
  TransactionMongoSchema,
)

export async function getTransactionHistoryForUser(
  userId: string,
): Promise<Transaction[]> {
  return await TransactionModel.find({ userId }, null, {
    sort: { timestamp: -1 },
  })
}

/**
 * Sums transactions by user and type within a specified time period.
 *
 * This function aggregates transactions of a specific type made by a user within a given time period.
 * It can optionally exclude incoming transactions (where the amount is greater than 0).
 *
 * Note: Depending on the transaction type, this function may return negative values. For example, if the transaction type represents some kind of withdrawal or expense, the summed total amount could be negative.
 *
 * @param userId - The ID of the user whose transactions should be summed.
 * @param type - The type of transactions to sum.
 * @param startDate - The start of the time period within which to sum transactions.
 * @param endDate - The end of the time period within which to sum transactions.
 * @param excludeIncomingTransactions - Optional. Whether to exclude incoming transactions (where the amount is greater than 0). Defaults to false.
 * @returns The summed total amount of the user's transactions of the specified type within the specified time period.
 */
export async function sumTransactionsByTypeInTimePeriod(
  userId: string,
  type: TransactionType,
  startDate: Date,
  endDate: Date,
  excludeIncomingTransactions: boolean = false,
): Promise<number> {
  const matchStage: PipelineStage.Match = {
    $match: {
      userId,
      type,
      createdAt: { $gte: startDate, $lte: endDate },
    },
  }

  if (excludeIncomingTransactions) {
    matchStage.$match.amount = { $lte: 0 }
  }

  const groupStage: PipelineStage.Group = {
    $group: {
      _id: null,
      summedTotalAmount: {
        $sum: '$amount',
      },
    },
  }
  const sumDoc = await TransactionModel.aggregate([matchStage, groupStage])

  return sumDoc[0]?.summedTotalAmount ?? 0
}

export const getBonusTransactionData = async (
  userId: string,
  types: TransactionType[],
) => {
  const results = await TransactionModel.aggregate([
    { $match: { userId, type: { $in: types } } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ])

  const result = results[0]

  if (!result) {
    return null
  }

  const { totalAmount, count } = result
  return { totalAmount, count }
}

export async function tableSearchTransactions(
  limit = 25,
  page = 0,
  sortObj: Record<string, SortOrder> = { timestamp: -1 },
  filterObj: FilterQuery<Transaction> = {},
): Promise<TableSearchResult<Transaction>> {
  // Mom, I am sorry. We can't run a migration without taking down the cluster. Slowly repair.
  if (filterObj.userId && filterObj.balanceType) {
    const { userId, balanceType } = filterObj
    await TransactionModel.updateMany(
      {
        userId,
        balanceType: getSelectedBalanceFieldFromIdentifier({
          balanceIdentifier: balanceType,
        }),
      },
      {
        balanceType: validateAndGetBalanceType({
          balanceIdentifier: balanceType,
        }),
      },
    )
  }

  if (!filterObj.userId) {
    return {
      page,
      limit,
      count: 0,
      data: [],
    }
  }

  const query = () => TransactionModel.find(filterObj).sort(sortObj)

  return {
    page,
    limit,
    count: await query().countDocuments(),
    data: await query()
      .limit(limit)
      .skip(page * limit),
  }
}

/**
 * @deprecated stop gap until OLAP
 * @todo replace with OLAP
 */
export const getKOTHTransactionsByUserId = async (userId: string) => {
  return await TransactionModel.find({ userId, type: 'koth' }).lean<
    Array<Transaction<'koth'>>
  >()
}

export const createTransaction = async <Type extends TransactionType>({
  user,
  amount,
  transactionType,
  meta,
  balanceType,
  session,
  resultantBalance,
  // If this value is not set, the client will update the balance immediately.
  balanceUpdateTimestamp = new Date(),
}: CreateTransaction<Type>): Promise<{ transactionId: string }> => {
  const { id: userId } = user
  const logger = userLogger('createTransaction', { userId })
  // TODO eventually we will not be putting all balances on txns and just the changed balance.
  const balances = await mapBalanceInformation(user)
  balances[balanceType] = resultantBalance
  const currentBalances = formatCurrentBalancesForUser(balances)

  const payload = {
    ...currentBalances,
    userId,
    amount,
    type: transactionType,
    meta,
    balanceType,
  }

  const result = await (async () => {
    try {
      if (session) {
        const doc = await new TransactionModel(payload).save({ session })
        return { transactionId: doc.toObject<Transaction>()._id.toString() }
      }

      const doc = await TransactionModel.create(payload)

      const transactionCreatedPayload = {
        delta: amount,
        balanceType,
        currentBalance: balances[balanceType],
        balanceUpdateTimestamp,
      }
      io.to(userId).emit('transactionCreated', transactionCreatedPayload)

      return { transactionId: doc.toObject<Transaction>()._id.toString() }
    } catch (error) {
      logger.error(
        `Unable to create transaction - ${error.message}`,
        { payload },
        error,
      )
      throw new Error('Unable to create transaction')
    }
  })()

  // Conditionally write stats.
  ;(async () => {
    try {
      await writeStatsForTransaction({
        userId,
        amount,
        transactionType,
        meta,
        balanceType,
      })
    } catch (error) {
      logger.error(
        `Unable to write stats for transaction - ${error.message}`,
        {
          payload,
          result,
        },
        error,
      )
    }
  })()

  return result
}

const formatCurrentBalancesForUser = (
  balances: UserBalances,
): CurrentBalances => {
  const portfolioTypes = Object.keys(balances).filter(balanceKey =>
    isPortfolioBalanceType(balanceKey),
  ) as PortfolioBalanceType[]

  const portfolioReduced = portfolioTypes.reduce<
    Partial<Record<PortfolioBalanceType, number>>
  >((acc, balanceKey) => {
    return {
      ...acc,
      [balanceKey]: balances[balanceKey],
    }
  }, {})

  return {
    currentBalance: balances.crypto,
    currentCashBalance: balances.cash,
    currentEthBalance: balances.eth,
    currentLtcBalance: balances.ltc,
    // TODO don't store these as nested
    currentAltcoinBalances: portfolioReduced,
  }
}

export const getFirstTimeDepositDate = async (userId: string) => {
  const transaction = await TransactionModel.findOne(
    { userId, type: 'deposit' },
    null,
    { sort: { createdAt: 1 } },
  )
  return transaction?.createdAt ?? transaction?.timestamp // Legacy documents don't have updatedAt + createdAt
}

/* FEEDS */
const transactionChangeFeed = async () => {
  let logUserId = null
  try {
    await mongoChangeFeedHandler<Transaction>(
      TransactionModel,
      async document => {
        if (document.fullDocument) {
          const { userId, balanceType } = document.fullDocument
          logUserId = userId
          const user = await getUserById(userId)

          if (user) {
            const balances = await mapBalanceInformation(user)

            publishUserBalanceUpdateMessageToFastTrack({
              userId,
              balances: [
                {
                  amount: balances[balanceType],
                  currency: getUserFiatCurrency(userId),
                  key: 'real_money',
                  exchange_rate: 1, // Everything stored in USD
                },
                // TODO: We need to take into account bonuses, but for now default to 0
                {
                  amount: 0,
                  currency: getUserFiatCurrency(userId),
                  key: 'bonus_money',
                  exchange_rate: 1,
                },
              ],
            })
          }
        }
      },
    )
  } catch (error) {
    userLogger('transactionChangeFeed', { userId: logUserId }).error(
      'There was an error in the withdrawals change feed',
      {},
      error,
    )
  }
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: TransactionModel.collection.name,
  feeds: [transactionChangeFeed],
}
