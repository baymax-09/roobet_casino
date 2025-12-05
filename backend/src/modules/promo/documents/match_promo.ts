import { type FilterQuery, type UpdatePayload } from 'mongoose'

import { io, mongoose } from 'src/system'
import {
  createNotification,
  getUserById,
  type Types as UserTypes,
} from 'src/modules/user'
import {
  creditBalance,
  deductFromBalance,
  getBalanceFromUserAndType,
} from 'src/modules/user/balance'
import { updateUser } from 'src/modules/user'
import { APIValidationError } from 'src/util/errors'
import { checkUserHasOpenBets } from 'src/modules/bet/lib/openBets'
import { type TPGame } from 'src/modules/tp-games'
import { type DBCollectionSchema } from 'src/modules'
import { type Currency } from 'src/modules/currency/types'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { translateForUser } from 'src/util/i18n'
import { scopedLogger } from 'src/system/logger'
import { recordStat } from 'src/modules/stats/lib/userEventStatUpdates'
import { promoLogger } from '../lib/logger'

const BonusTypes = ['fixed', 'percentMatch'] as const
export type BonusTypesUnion = (typeof BonusTypes)[number]
export interface MatchPromo {
  userId: string
  wagerRequirementMultiplier?: number
  maxMatch?: number
  percentMatch?: number
  fixedAmount?: number
  expirationDate?: Date
  bonusType: BonusTypesUnion
  reason: string
  minDeposit?: number
  leftToWager: number
  amountMatched: number
  canWithdraw: boolean
  balanceType: UserTypes.BalanceType
  currency: Currency
  issuerId: string
  amountDeposited?: number
  id?: string
  _id?: string
  createdAt: string
  updatedAt: string
}

const MatchPromoSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    wagerRequirementMultiplier: Number,
    maxMatch: Number,
    percentMatch: Number,
    fixedAmount: Number,
    minDeposit: Number,
    expirationDate: Date,
    bonusType: { type: String, enum: BonusTypes },
    reason: { type: String },
    leftToWager: { type: Number, default: 0 },
    amountMatched: { type: Number },
    canWithdraw: { type: Boolean, default: true },
    balanceType: { type: String },
    // temporary default value
    currency: { type: String, default: 'usd' },
    amountDeposited: Number,
    issuerId: { type: String },
  },
  { timestamps: true },
)

const MatchPromoModel = mongoose.model<MatchPromo>(
  'match_promos',
  MatchPromoSchema,
)

export const depositBonusLogger = scopedLogger('depositBonus')

export async function createMatchPromo(
  userId: string,
  bonusType: string,
  reason: string,
  staffId: string,
  fixedAmount?: number,
  maxMatch?: number,
  percentMatch?: number,
  wagerRequirementMultiplier?: number,
  minDeposit?: number,
  expirationDate?: Date,
  override = false,
) {
  if (!override) {
    const existingPromo = await getMatchPromoForUser(userId)
    if (existingPromo) {
      throw new APIValidationError(
        'User already has a match promo running, pass override=true to create a new one',
      )
    }
  }

  await deleteMatchPromo(userId)
  const newPromo = await MatchPromoModel.create({
    userId,
    bonusType: bonusType === 'Fixed' ? 'fixed' : 'percentMatch',
    reason,
    fixedAmount,
    maxMatch,
    percentMatch,
    wagerRequirementMultiplier,
    minDeposit,
    expirationDate,
    issuerId: staffId,
  })
  await updateUser(userId, { hasMatchPromoActive: true })
  emitPromoUpdate(newPromo)
  return newPromo
}

export async function getMatchPromoForUser(
  userId: string,
): Promise<MatchPromo | null> {
  return await MatchPromoModel.findOne({
    userId,
  })
}

export async function checkMatchPromoUserCanWithdraw(
  userId: string,
  balanceType: UserTypes.BalanceType,
): Promise<boolean> {
  const promo = await MatchPromoModel.findOne({
    userId,
    canWithdraw: false,
    balanceType,
  }).lean()
  return !promo
}

export async function matchPromoDepositHook(
  userId: string,
  amount: number,
  balanceType: UserTypes.BalanceType,
): Promise<void> {
  const promo = await MatchPromoModel.findOne({
    userId,
  })
  const logger = depositBonusLogger('matchPromoDepositHook', { userId })

  if (!promo) {
    return
  }

  if (promo && promo.amountMatched) {
    return
  }

  const user = await getUserById(userId)
  if (!user) {
    logger.error(`No user found with userId: ${userId}`)
    return
  }

  if (promo.balanceType && promo.balanceType !== balanceType) {
    return
  }

  if (promo.minDeposit && amount < promo.minDeposit) {
    return
  }

  if (promo.expirationDate && new Date(promo.expirationDate) < new Date()) {
    // delete promo if past expiration date
    await deleteMatchPromo(userId)
    return
  }

  const amountMatched =
    promo.bonusType === 'fixed'
      ? promo.fixedAmount
      : (Math.min(amount, promo.maxMatch ?? 0) * (promo.percentMatch ?? 0)) /
        100.0

  if (amountMatched === undefined) {
    return
  }

  const transactionType =
    promo.bonusType === 'fixed' ? 'depositBonus' : 'matchPromo'

  if (!promo.wagerRequirementMultiplier) {
    const convertedCredits = await exchangeAndFormatCurrency(
      amountMatched,
      user,
    )
    const message = translateForUser(user, 'promo__credited', [
      convertedCredits,
    ])
    await createNotification(userId, message, 'deposit', {
      amount: amountMatched,
      type: balanceType,
    })
    await updateMatchPromo(
      { userId },
      {
        $set: {
          amountMatched,
          balanceType,
        },
      },
    )
    await deleteMatchPromo(userId)
  } else {
    await updateMatchPromo(
      { userId },
      {
        $set: {
          canWithdraw: false,
          amountMatched,
          leftToWager:
            promo.wagerRequirementMultiplier * (amountMatched + amount),
          amountDeposited: amount,
          balanceType,
        },
      },
    )
  }
  logger.info('Credited deposit bonus', { promo })
  const balanceReturn = await creditBalance({
    user,
    amount: amountMatched,
    transactionType,
    meta: {
      promoId: promo._id,
      reason: promo.reason,
      issuerId: promo.issuerId ?? '',
    },
    balanceTypeOverride: balanceType,
  })
  // If we successfully credit balance for depositBonus, increment fields in stats collections
  if (typeof balanceReturn.transactionId === 'string') {
    await recordStat(
      user,
      { key: 'depositBonusMatched', amount: amountMatched },
      true,
    )
  }
}

export async function updateMatchPromo(
  filter: FilterQuery<MatchPromo>,
  update: UpdatePayload<MatchPromo>,
): Promise<MatchPromo | null> {
  const logger = depositBonusLogger('updatedMatchPromo', {
    userId: filter.userId,
  })
  const updated = await MatchPromoModel.findOneAndUpdate(filter, update, {
    new: true,
    lean: true,
  })
  if (updated) {
    await updateUser(filter.userId, {
      hasMatchPromoActive: !updated.canWithdraw,
    })
    emitPromoUpdate(updated)
  }
  logger.info('Updated Match Promo', { updated })
  return updated
}

async function deleteMatchPromo(userId: string): Promise<void> {
  await MatchPromoModel.deleteMany({ userId })
  await updateUser(userId, { hasMatchPromoActive: false })
}

// TODO should be refactored to use Mongo change feeds
const emitPromoUpdate = (promo: MatchPromo) => {
  io.to(promo.userId).emit('matchPromo', { promo })
}

export async function getMatchPromos(): Promise<MatchPromo[]> {
  return await MatchPromoModel.find().lean()
}

export async function matchPromoBetHook(
  userId: string,
  betAmount: number,
  balanceType: UserTypes.BalanceType,
): Promise<void> {
  const logger = depositBonusLogger('matchPromoBetHook', { userId })
  const updated = await updateMatchPromo(
    {
      userId,
      balanceType,
      wagerRequirementMultiplier: { $exists: true },
    },
    {
      $inc: {
        leftToWager: -betAmount,
      },
    },
  )
  logger.info('Updated Match Promo Bet Hook', { updated })
  if (updated && updated.leftToWager <= 0) {
    await abortMatchPromoNoPenalty(userId)
  }
}

export async function abortMatchPromoWithPenalty(
  userId: string,
): Promise<void> {
  const user = await getUserById(userId)
  if (!user) {
    throw new APIValidationError('User not found')
  }
  const logger = depositBonusLogger('abortMatchPromoWithPenalty', { userId })
  const promo = await getMatchPromoForUser(userId)
  if (!promo) {
    throw new APIValidationError('User does not have a match promo running')
  }

  await checkUserHasOpenBets(userId, promo.createdAt)

  // drain users balance on promo balanceType
  if (!promo.canWithdraw) {
    const balanceReturn = await getBalanceFromUserAndType({
      user,
      balanceType: promo.balanceType,
    })

    await deductFromBalance({
      user,
      amount: balanceReturn.balance,
      meta: {},
      transactionType: 'early abort match promo',
      balanceTypeOverride: balanceReturn.balanceType,
    })
  }
  logger.info('Aborted Match Promo With Penalty', { promo })
  await deleteMatchPromo(userId)
}

export async function abortMatchPromoNoPenalty(userId: string): Promise<void> {
  await deleteMatchPromo(userId)
}

export async function checkUserMatchPromoCanPlayGame(
  user: UserTypes.User,
  gameName: string,
  providerGame: TPGame,
  balanceType: UserTypes.BalanceType,
): Promise<
  { canPlaceBet: true; reason: null } | { canPlaceBet: false; reason: string }
> {
  promoLogger('checkUserMatchPromoCanPlayGame', { userId: user.id }).info(
    `Match Promo ${gameName}, ${balanceType}, ${providerGame}`,
    {
      gameName,
      balanceType,
      providerGame,
    },
  )
  if (!user.hasMatchPromoActive) {
    return { canPlaceBet: true, reason: null }
  }

  const promo = await getMatchPromoForUser(user.id)
  // allow users to bet balance types that are diff than the one on the promo
  if (!promo || promo.balanceType !== balanceType) {
    return { canPlaceBet: true, reason: null }
  }

  if (providerGame.live) {
    return { canPlaceBet: false, reason: 'promo__game_not_allowed' }
  }

  gameName = gameName.toLowerCase()
  const promoBannedGameNames = [
    'blackjack',
    'bj',
    'baccarat',
    'dice',
    'plinko',
    'slotegrator:sportsbook-1',
  ] as const

  // allow VIP to make wagers on sports for deposit bonuses
  if (
    (user.role === 'VIP' || user.isWhale) &&
    gameName === 'slotegrator:sportsbook-1'
  ) {
    return { canPlaceBet: true, reason: null }
  }

  if (promoBannedGameNames.some(name => gameName.includes(name))) {
    return { canPlaceBet: false, reason: 'promo__game_not_allowed' }
  }

  return { canPlaceBet: true, reason: null }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: MatchPromoModel.collection.name,
}
