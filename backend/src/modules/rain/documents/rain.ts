import moment from 'moment'
import * as OneSignal from 'onesignal-node'

import { getUserById, type Types as UserTypes } from 'src/modules/user'
import { r, config } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { translateForUserId } from 'src/util/i18n'
import { sumDepositsInTimePeriod } from 'src/modules/deposit'
import { sumCashDepositsInTimePeriod } from 'src/vendors/paymentiq/documents/cash_deposit_transactions'
import { APIValidationError } from 'src/util/errors'
import { getWagerRequirement } from 'src/util/helpers/wagerRequirements'
import { tableFeed } from 'src/util/rethink'
import { modifyBetGoal } from 'src/modules/user/lib/betGoal'
import { createNotification, userHasDeposited } from 'src/modules/user'
import { checkUserCanTip } from 'src/modules/user/lib/tips'
import { isRoleAccessPermitted } from 'src/modules/rbac'
import {
  getBalanceFromUserAndType,
  deductFromBalance,
  creditBalance,
} from 'src/modules/user/balance'
import { subtractTime } from 'src/util/helpers/time'
import { type BalanceType } from 'src/modules/user/types'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

import { RainStatus } from '../lib/rainProcess'
import { rainLogger } from '../lib/logger'

const client = new OneSignal.Client(
  '29c72f64-e7e6-408c-99b2-d86a84c6a9cb',
  'ZmY1ZjAzOTQtMGVhYS00NGVjLWFlMDAtZjQzZjE0Y2E2N2Ni',
)

export interface Rain {
  id: string
  creatorUserId: string
  creatorName: string
  createdByUser: boolean
  amount: number
  rainInit: string
  rainStartTime: string
  rainEndTime: string
  usersEnteredRain: Record<string, any>
  usersShareOfRain: Record<string, any>
  status: string
  balanceType: BalanceType
}

const RainModel = r.table<Rain>('rains')

export async function createRain(
  creatorUser: UserTypes.User,
  amount: number,
  countdown: number,
  duration: number,
) {
  // first we need to make sure there are no active rains:
  const creatorUserId = creatorUser.id
  let createdByUser = false
  amount = parseFloat(amount.toString())

  // need to add countdown to this check
  const activeRainCount = await RainModel.getAll(RainStatus.Active, {
    index: 'status',
  })
    .count()
    .run()
  const countdownRainCount = await RainModel.getAll(RainStatus.Countdown, {
    index: 'status',
  })
    .count()
    .run()

  if (amount === undefined) {
    throw new APIValidationError('rain__min', [`${config.rains.minRain}`])
  }

  if (amount < config.rains.minRain) {
    throw new APIValidationError('rain__min', [`${config.rains.minRain}`])
  }

  if (amount > 2000) {
    const convertedMax = await exchangeAndFormatCurrency(2000, creatorUser)
    throw new APIValidationError('rain__convertedMax', [`${convertedMax}`])
  }

  if (!creatorUser.staff) {
    await checkUserCanTip(creatorUser)
  }

  // sets countdown to the default environment value if not specified when created by the route
  if (countdown === undefined) {
    countdown = config.rains.countdown
  }

  if (duration === undefined) {
    duration = config.rains.duration
  }

  if (activeRainCount > 0 || countdownRainCount > 0) {
    throw new APIValidationError('rain__active')
  }

  const balanceReturn = await getBalanceFromUserAndType({
    user: creatorUser,
    balanceType: creatorUser.selectedBalanceType,
  })

  const hasRainsCreateAccess = await isRoleAccessPermitted({
    user: creatorUser,
    requests: [{ action: 'create', resource: 'rains' }],
  })

  // if the user is a non-officer then they must have deposited and a balance leftover
  if (!hasRainsCreateAccess) {
    if (balanceReturn.balance - amount < config.minTipBal) {
      throw new APIValidationError('rain__min_bal', [`${config.minTipBal}`])
    }

    if (!userHasDeposited(creatorUser)) {
      throw new APIValidationError('rain__deposit_first')
    }

    await deductFromBalance({
      user: creatorUser,
      amount,
      meta: {
        creator: true,
      },
      transactionType: 'rain',
      balanceTypeOverride: balanceReturn.balanceType,
    })

    // within the non-officer checked area, countdown and duration are set to default values
    countdown = config.rains.countdown
    duration = config.rains.duration
    createdByUser = true
  }

  const endMins = countdown + duration

  await RainModel.insert({
    balanceType: balanceReturn.balanceType,
    creatorUserId,
    creatorName: creatorUser.name,
    createdByUser,
    amount,
    rainInit: moment().toISOString(),
    rainStartTime: moment().add(countdown, 'minutes').toISOString(),
    rainEndTime: moment().add(endMins, 'minutes').toISOString(),
    usersEnteredRain: {},
    usersShareOfRain: {},
    status: 'countdown',
  }).run()

  const notification = {
    template_id: '2dc62bf3-40bb-4213-be23-ccc8103c22a4',
    filters: [
      { field: 'tag', key: 'rainNotifications', relation: '=', value: true },
    ],
  }

  client.createNotification(notification).catch((error: Error) => {
    rainLogger('createRain', { userId: creatorUserId }).error(
      `OnesignalError - ${error.message}`,
      { notification },
      error,
    )
  })
}

export async function currentRain(): Promise<Rain | null> {
  const [rain] = await RainModel.getAll(
    RainStatus.Active,
    RainStatus.Countdown,
    { index: 'status' },
  ).run()
  return rain
}

export async function joinRain(user: UserTypes.User) {
  const activeRain = await currentRain()
  if (!activeRain) {
    throw new APIValidationError('no__rain')
  }

  const userId = user.id
  if (activeRain.usersEnteredRain[userId]) {
    throw new APIValidationError('rain__dupe_join')
  }

  if (activeRain.status !== RainStatus.Active) {
    throw new APIValidationError('rain__not_active')
  }

  if (user.isPromoBanned) {
    throw new APIValidationError('promo__not_qualified')
  }

  const hasRainsManageAccess = await isRoleAccessPermitted({
    user,
    requests: [{ action: 'manage', resource: 'rains' }],
  })

  if (!hasRainsManageAccess) {
    const periodOfTimeBefore = subtractTime(14, 'days', new Date())
    const cryptoDeposits = await sumDepositsInTimePeriod(
      userId,
      periodOfTimeBefore,
      new Date(),
    )
    const cashDeposits = await sumCashDepositsInTimePeriod(
      userId,
      periodOfTimeBefore,
      new Date(),
    )
    const totalDepositsInTimePeriod = cryptoDeposits + cashDeposits

    if (totalDepositsInTimePeriod < 25) {
      const convertedDepositedAmount = await exchangeAndFormatCurrency(25, user)
      throw new APIValidationError('rain__convertedDeposit_limit', [
        `${convertedDepositedAmount}`,
        '14',
      ])
    }
  }
  await RainModel.get(activeRain.id)
    .update({ usersEnteredRain: { [userId]: true } })
    .run()
}

export async function userShareOfRain(userId: string, activeRain: Rain) {
  const perUserAmount =
    activeRain.amount / Object.keys(activeRain.usersEnteredRain).length

  await RainModel.get(activeRain.id)
    .update({ usersShareOfRain: { [userId]: perUserAmount } })
    .run()

  const balanceType = activeRain.balanceType

  const user = await getUserById(userId)

  if (!user) {
    throw new APIValidationError('user__does_not_exist')
  }

  await creditBalance({
    user,
    amount: perUserAmount,
    meta: {
      creator: false,
    },
    transactionType: 'rain',
    balanceTypeOverride: balanceType,
  })

  await modifyBetGoal(
    userId,
    perUserAmount * getWagerRequirement(balanceType),
    balanceType,
  )

  const convertedRainAward = await exchangeAndFormatCurrency(
    perUserAmount,
    user,
  )
  const rainAwardMessage = await translateForUserId(
    userId,
    'rain__convertedAward',
    [`${convertedRainAward}`],
  )
  await createNotification(userId, rainAwardMessage, 'rain')
}

export async function payoutAllRainUsers(rainId: string): Promise<void> {
  const finalizedRain = await RainModel.get(rainId).run()
  if (!finalizedRain) {
    return
  }
  for (const [userId, _] of Object.entries(finalizedRain.usersEnteredRain)) {
    await userShareOfRain(userId, finalizedRain)
  }
}

export async function changeRainStatus(
  rainId: string,
  newStatus: string,
): Promise<void> {
  await RainModel.get(rainId).update({ status: newStatus }).run()
}

async function rainFeed() {
  await tableFeed<Partial<Rain>>('rains', 'rainUpdate', false, rain => {
    delete rain.usersEnteredRain
    delete rain.usersShareOfRain
    return rain
  })
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'rains',
  indices: [{ name: 'status' }],
  feeds: [rainFeed],
}
