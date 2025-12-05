import moment from 'moment'

import { r } from 'src/system'
import { APIValidationError } from 'src/util/errors'
import { updateUser } from 'src/modules/user/documents/user'
import { type Types as UserTypes } from 'src/modules/user'
import { getUserByName } from 'src/modules/user'
import { addAffiliate } from 'src/modules/affiliate/lib'
import { modifyBetGoal } from 'src/modules/user/lib/betGoal'
import { UserStatsModel } from 'src/modules/stats'
import {
  countUserDepositsInTimePeriod,
  sumDepositsInTimePeriod,
} from 'src/modules/deposit'
import { type DBCollectionSchema } from 'src/modules'
import { creditBalance } from 'src/modules/user/balance'
import {
  getCRMByUserId,
  updateCRMIfNotExist,
} from 'src/modules/crm/documents/crm'
import { subtractTime } from 'src/util/helpers/time'
import { type BalanceType } from 'src/modules/user/types'
import { getWagerRequirement } from 'src/util/helpers/wagerRequirements'
import {
  sumCashDepositsInTimePeriod,
  countUserCashDepositsInTimePeriod,
} from 'src/vendors/paymentiq/documents/cash_deposit_transactions'
import { promoLogger } from '../lib/logger'

interface BasePromotion {
  id: string
  /** Not required if Roowards Bonus */
  balanceType: BalanceType | null
  creatorUserId: string
  claimAmount: number
  roowardsBonus: boolean
  claimsRemaining: number
  originalClaims: number
  expiration: string
  code: string
  /** @todo switch from false to null */
  depositCount: { amount: number; hours: number } | false
  /** @todo switch from false to null */
  depositLimit: { amount: number; hours: number } | false
  /** @todo switch from false to null */
  wagerLimit: { amount: number; hours: number } | false
  hasNotDeposited: boolean
  affiliateName: string | false
  cxAffId: string // Cellxpert Affiliate ID
  mustBeAffiliated: boolean
  claimedUserIds: Record<string, boolean>
  claimedUserIPs: Record<string, boolean>
  timestamp: string
  // LEGACY
  newUsersOnly?: boolean
  activeOnly?: boolean
}
type Promotion =
  | (BasePromotion & {
      roowardsBonus: true
      balanceType: null
    })
  | (BasePromotion & {
      roowardsBonus: false
      balanceType: BalanceType
    })

interface PromoOptionWindow {
  hours: number
  amount: number
}
interface PromoOptions {
  hasNotDeposited: boolean
  depositCount: PromoOptionWindow | false
  depositLimit: PromoOptionWindow | false
  wagerLimit: PromoOptionWindow | false
  affiliateName: string | false
  mustBeAffiliated: boolean
  cxAffId?: string // Cellxpert Affiliate ID optional until we support bulk inserts for this feature
}

interface UpdatePromoCodeArgs {
  id: string
  claimAmountUpdate?: number
  claimsRemainingUpdate?: number
  expireTimeUpdate?: string
}

const PromoCode = r.table<Promotion>('promo_codes')

export const getAllByCode = async (code: string) =>
  await PromoCode.getAll(code, { index: 'code' }).run()
export const countAllByCode = async (code: string) =>
  await PromoCode.getAll(code, { index: 'code' }).count().run()

export async function createPromoCode(
  creatorUserId: string,
  claimAmount: number,
  roowardsBonus: boolean,
  claimsRemaining: number,
  expireTime: number,
  code: string,
  balanceTypeOverride: UserTypes.BalanceType | null,
  options: PromoOptions = {
    hasNotDeposited: false,
    depositCount: false,
    depositLimit: false,
    wagerLimit: false,
    affiliateName: false,
    mustBeAffiliated: false,
    cxAffId: '',
  },
) {
  const duplicateCount = await PromoCode.getAll(code, { index: 'code' })
    .count()
    .run()
  if (duplicateCount === 0) {
    await PromoCode.insert({
      balanceType: balanceTypeOverride,
      creatorUserId,
      claimAmount,
      roowardsBonus,
      claimsRemaining,
      originalClaims: claimsRemaining,
      expiration: moment().add(expireTime, 'hours').toISOString(),
      code,
      depositCount: options.depositCount,
      depositLimit: options.depositLimit,
      wagerLimit: options.wagerLimit,
      hasNotDeposited: options.hasNotDeposited,
      affiliateName: options.affiliateName,
      cxAffId: options.cxAffId!,
      mustBeAffiliated: options.mustBeAffiliated,
      claimedUserIds: {},
      claimedUserIPs: {},
      timestamp: moment().toISOString(),
    }).run()
  } else {
    throw new APIValidationError('promo__exists')
  }
}

export async function getAllPromoCodes(): Promise<Promotion[]> {
  return await PromoCode.orderBy({ index: r.desc('timestamp') }).run()
}

export async function redeemPromoCode(
  user: UserTypes.User,
  code: string,
  ip: string,
): Promise<
  | { referral: true }
  | { roowardsBonus: true }
  | { redeemed: true; amount: number; amountType: string }
> {
  const userId = user.id

  const [promoCode] = await PromoCode.getAll(code, { index: 'code' }).run()
  if (!promoCode) {
    throw new APIValidationError('promo__non_exists')
  }
  if (promoCode.code !== code) {
    throw new APIValidationError('promo__non_exists')
  }

  // check for expire
  if (promoCode.expiration < moment().toISOString()) {
    throw new APIValidationError('promo__ended')
  }

  // check if claims ran out
  if (promoCode.claimsRemaining < 1) {
    throw new APIValidationError('promo__ended')
  }

  // check if already claimed
  if (promoCode.claimedUserIds[userId]) {
    throw new APIValidationError('promo__claimed')
  }

  // check if IP address has already claimed
  if (ip && promoCode.claimedUserIPs[ip]) {
    throw new APIValidationError('promo__once_per_household')
  }

  // check for totalDeposits flag
  const depositCount = promoCode.depositCount // { amount: INT, hours: HOURS or false if lifetime }
  if (depositCount) {
    if (depositCount.amount > user.hiddenTotalDeposits) {
      throw new APIValidationError('promo__not_qualified')
    }
    if (depositCount.hours) {
      const periodOfTimeBefore = subtractTime(
        depositCount.hours,
        'hours',
        new Date(),
      )
      const userCashDepositCount = await countUserCashDepositsInTimePeriod(
        userId,
        periodOfTimeBefore,
        new Date(),
      )

      const userCryptoDepositCount = await countUserDepositsInTimePeriod(
        userId,
        periodOfTimeBefore,
        new Date(),
      )

      const userTotalDepositCount =
        userCashDepositCount + userCryptoDepositCount
      if (depositCount.amount > userTotalDepositCount) {
        throw new APIValidationError('promo__not_qualified')
      }
    }
  }

  // check if they have not deposited
  if (promoCode.hasNotDeposited && user.hiddenTotalDeposited !== 0) {
    throw new APIValidationError('promo__new_players')
  }

  // check for totalDeposits flag
  const depositLimit = promoCode.depositLimit // { amount: INT, hours: HOURS or false if lifetime }
  if (depositLimit && depositLimit.amount) {
    if (!depositLimit.hours) {
      if (depositLimit.amount > user.hiddenTotalDeposited) {
        throw new APIValidationError('promo__not_qualified')
      }
    }
    if (depositLimit.hours > 0) {
      const periodOfTimeBefore = subtractTime(
        depositLimit.hours,
        'hours',
        new Date(),
      )
      const cashDeposited = await sumCashDepositsInTimePeriod(
        userId,
        periodOfTimeBefore,
        new Date(),
      )
      const cryptoDeposited = await sumDepositsInTimePeriod(
        userId,
        periodOfTimeBefore,
        new Date(),
      )

      const totalDeposited = cashDeposited + cryptoDeposited
      if (totalDeposited < depositLimit.amount) {
        throw new APIValidationError('promo__not_qualified')
      }
    }
  }

  const wagerLimit = promoCode.wagerLimit // { amount: INT, hours: HOURS or false if lifetime }
  if (wagerLimit && wagerLimit.amount) {
    if (!wagerLimit.hours) {
      if (wagerLimit.amount > user.hiddenTotalBet) {
        throw new APIValidationError('promo__not_qualified')
      }
    }
    if (wagerLimit.hours > 0) {
      const stats = await UserStatsModel.sumUserStatFields(
        userId,
        // @ts-expect-error moment vs string again
        moment().subtract(wagerLimit.hours, 'hours'),
        moment(),
        ['totalBet'],
      )
      const wagered = stats.totalBet ?? 0

      if (wagered < wagerLimit.amount) {
        throw new APIValidationError('promo__not_qualified')
      }
    }
  }

  // OLD LEGACY
  if (promoCode.newUsersOnly && user.hiddenTotalDeposited !== 0) {
    throw new APIValidationError('promo__new_user')
  }

  if (promoCode.newUsersOnly && user.promosClaimed && user.promosClaimed > 0) {
    throw new APIValidationError('promo__new_players')
  }

  if (promoCode.mustBeAffiliated && promoCode.affiliateName) {
    const affiliate = await getUserByName(promoCode.affiliateName, true)
    if (user.affiliateId && user.affiliateId !== affiliate?.id) {
      throw new APIValidationError('promo__must_be_affiliated', [
        promoCode.affiliateName,
      ])
    }
  }

  // OLD LEGACY
  if (promoCode.activeOnly) {
    // check for last 7 days
    const periodOfTimeBefore = subtractTime(7, 'days', new Date())
    const numDepositsLastWeek = await countUserDepositsInTimePeriod(
      userId,
      periodOfTimeBefore,
      new Date(),
    )
    if (numDepositsLastWeek === 0) {
      throw new APIValidationError('promo__deposit_this_week')
    }
  }

  // credit the user
  const updates = await PromoCode.getAll(code, { index: 'code' })
    .update(
      {
        claimedUserIds: { [user.id]: true },
        claimedUserIPs: { [ip || 'unknown']: true },
        claimsRemaining: r.row('claimsRemaining').sub(1),
      },
      { returnChanges: true },
    )
    .run()

  const oldVal = updates.changes[0].old_val
  if (oldVal.claimedUserIds[userId]) {
    await PromoCode.getAll(code, { index: 'code' })
      .update({ claimsRemaining: r.row('claimsRemaining').add(1) })
      .run()
    throw new APIValidationError('promo__claimed')
  }
  if (oldVal.claimsRemaining < 1) {
    throw new APIValidationError('promo__ended')
  }

  if (promoCode.roowardsBonus) {
    await updateUser(user.id, { roowardsBonus: 1000 })
    return { roowardsBonus: true }
  }

  if (!promoCode.roowardsBonus) {
    const balanceTypeOverride = promoCode.balanceType

    await creditBalance({
      user,
      amount: promoCode.claimAmount,
      transactionType: 'promo',
      meta: {
        code,
      },
      balanceTypeOverride,
    })

    await modifyBetGoal(
      user.id,
      promoCode.claimAmount * getWagerRequirement(balanceTypeOverride),
      balanceTypeOverride,
    )
  }

  // Check cellxpert affiliate id. Promo code cannot be linked to an affiliate on Roobet + a Cellxpert affiliate.
  if (promoCode.cxAffId && !user.affiliateId) {
    try {
      await updateCRMIfNotExist(user.id, {
        cxd: `${promoCode.cxAffId}_0`,
        cxAffId: promoCode.cxAffId,
      })
    } catch (error) {
      promoLogger('redeemPromoCode', { userId: user.id }).error(
        'promo cellxpert error updating crm',
        {
          cxd: `${promoCode.cxAffId}_0`,
          cxAffId: promoCode.cxAffId,
        },
        error,
      )
    }
  }

  if (promoCode.affiliateName && !user.affiliateId) {
    const userCrmRecord = await getCRMByUserId(user.id)
    const userCrmRecordHasCellxpertData =
      userCrmRecord?.cxd && userCrmRecord?.cxAffId

    if (!userCrmRecordHasCellxpertData) {
      await addAffiliate(user.id, promoCode.affiliateName)
      return { referral: true }
    }
  }

  return {
    redeemed: true,
    amount: promoCode.claimAmount,
    amountType: promoCode.balanceType,
  }
}

export async function updatePromoCode({
  id,
  claimAmountUpdate,
  claimsRemainingUpdate,
  expireTimeUpdate,
}: UpdatePromoCodeArgs): Promise<Promotion> {
  const update: Partial<Promotion> = {
    ...(claimAmountUpdate && { claimAmount: claimAmountUpdate }),
    ...(claimsRemainingUpdate && { claimsRemaining: claimsRemainingUpdate }),
    ...(typeof expireTimeUpdate === 'number' && {
      expiration: moment().add(expireTimeUpdate, 'hours').toISOString(),
    }),
  }

  const { changes } = await PromoCode.get(id)
    .update(update, { returnChanges: 'always' })
    .run()

  if (changes?.length) {
    return changes[0].new_val
  } else {
    throw new Error(`Error Updating Promo Code ${id}`)
  }
}

export async function deletePromoCode(id: string): Promise<void> {
  await PromoCode.get(id).delete().run()
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'promo_codes',
  indices: [{ name: 'code' }, { name: 'timestamp' }],
}
