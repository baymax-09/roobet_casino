import { config } from 'src/system'
import { APIValidationError } from 'src/util/errors'
import { checkMatchPromoUserCanWithdraw } from 'src/modules/promo/documents/match_promo'
import { checkSystemEnabled } from 'src/modules/userSettings'
import { countUnconfirmedTransactionsByUserId } from 'src/modules/deposit/documents/deposit_transactions_mongo'
import { addTipMessage } from 'src/modules/chat'
import { t } from 'src/util/i18n'
import { createNotification } from 'src/modules/messaging'
import { getCurrencyFromBalanceType } from 'src/modules/currency/types'
import { assessRisk, RiskStatus } from 'src/modules/fraud/riskAssessment'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

import { updateUser, userHasDeposited } from '../documents/user'
import { type BalanceType, type User } from '../types'
import {
  creditBalance,
  deductFromBalance,
  getBalanceFromUserAndType,
  isBalanceType,
} from '../balance'
import { assertBetGoalIsMet } from './betGoal'
import { hasSurpassedDailyWithdrawLimit } from './withdrawLimit'
import { checkReceivingUserEnabled } from 'src/modules/userSettings/lib'

interface TipArgs {
  fromUser: User
  toUser: User
  amount: number
  isPrivate: boolean
  note: string
  ip: string
  session: { id: string; data: string }
  customBalanceType?: BalanceType
}

interface RiskCheckTips {
  fromUser: User
  toUser: User
  amount: number
  balanceType: BalanceType
  ip: string
  session: { id: string; data: string }
}

interface PostTipArgs extends Omit<TipArgs, 'session' | 'ip'> {
  balanceType: BalanceType
}

export async function checkUserCanTip(user: User) {
  const unconfCount = await countUnconfirmedTransactionsByUserId(user.id)
  if (unconfCount > 0) {
    throw new APIValidationError('deposit__unconfirmed', [`${unconfCount}`])
  }

  const isEnabled = await checkSystemEnabled(user, 'tip')

  if (!isEnabled) {
    throw new APIValidationError('action__disabled')
  }

  await assertBetGoalIsMet(user, user.selectedBalanceType)
}

async function riskCheckTip(args: RiskCheckTips) {
  const { fromUser, amount, balanceType, ip, toUser, session } = args

  if (balanceType === 'cash') {
    throw new APIValidationError('tip__cash')
  }

  if (fromUser.staff) {
    return
  }

  const balanceReturn = await getBalanceFromUserAndType({
    balanceType,
    user: fromUser,
  })

  if (balanceReturn.balance - amount < config.minTipBal) {
    throw new APIValidationError('tip__min_bal', [`${config.minTipBal}`])
  }

  if (!userHasDeposited(fromUser) && !fromUser.isSponsor) {
    throw new APIValidationError('tip__deposit_first')
  }

  if (
    (await hasSurpassedDailyWithdrawLimit(fromUser, amount))
      .surpassedDailyWithdrawLimit
  ) {
    throw new APIValidationError('withdrawal__allowance')
  }
  // send risk check to Seon
  const fraudResponse = await assessRisk({
    user: fromUser,
    ip,
    actionType: 'tip',
    session,
    transaction: {
      amount,
      type: balanceType,
      currency: getCurrencyFromBalanceType(balanceType),
    },
    customFields: { tip_receiver: toUser.id },
  })

  const { seonResponse } = fraudResponse
  if (fraudResponse.state === RiskStatus.DECLINED) {
    for (const rule of seonResponse?.data.applied_rules ?? []) {
      if (rule.name.includes('WD MR - Tips declined')) {
        return {
          isDeclinedFromActiveWD: true,
        }
      }
    }
    return {
      isDeclined: true,
    }
  }

  await assertBetGoalIsMet(fromUser, balanceType)
}

async function validateTips(
  fromUser: User,
  toUser: User,
  amount: number,
  balanceType: string,
) {
  const isEnabled = await checkSystemEnabled(fromUser, 'tip')
  if (!isEnabled) {
    throw new APIValidationError('action__disabled')
  }

  const isEnabledTo = await checkReceivingUserEnabled(toUser, 'tip')
  if (!isEnabledTo) {
    throw new APIValidationError('tip__user_restricted')
  }

  if (amount < 0.1) {
    const convertedMin = await exchangeAndFormatCurrency(0.1, fromUser)
    throw new APIValidationError('tip__convertedAmount', [`${convertedMin}`])
  }

  if (fromUser.id === toUser.id) {
    throw new APIValidationError('tip__self')
  }

  if (!isBalanceType(balanceType)) {
    throw new APIValidationError('api__invalid_param', ['balanceType'])
  }

  if (!(await checkMatchPromoUserCanWithdraw(fromUser.id, balanceType))) {
    throw new APIValidationError('withdrawal__promo_incomplete')
  }

  await checkUserCanTip(fromUser)
}

async function postTipHooks(args: PostTipArgs) {
  const { fromUser, toUser, amount, isPrivate, note, balanceType } = args
  const convertedAmount = await exchangeAndFormatCurrency(amount, toUser)
  const tipMessage = t(toUser, 'tip__award', [
    `${convertedAmount}`,
    fromUser.name,
    !note ? '' : `Note: ${note}`,
  ])

  await createNotification(toUser.id, tipMessage, 'tip')

  if (isPrivate === false) {
    addTipMessage(toUser, fromUser, amount, note, balanceType)
  }
}

export async function sendTip(args: TipArgs) {
  const {
    fromUser,
    toUser,
    amount,
    isPrivate,
    note: rawNote,
    ip,
    session,
    customBalanceType,
  } = args
  const note = rawNote || ''
  const balanceReturn = await getBalanceFromUserAndType({
    user: fromUser,
    balanceType: customBalanceType ?? fromUser.selectedBalanceType,
  })
  const { balance, balanceType } = balanceReturn

  await validateTips(fromUser, toUser, amount, balanceType)
  const riskData = await riskCheckTip({
    fromUser,
    amount,
    balanceType,
    ip,
    session,
    toUser,
  })

  if (riskData?.isDeclinedFromActiveWD) {
    throw new APIValidationError('tip__active_withdrawal')
  }

  if (riskData?.isDeclined) {
    throw new APIValidationError('tip__fraud_error')
  }

  // TODO not sure where this should go exactly?
  if (fromUser.howieDeal) {
    const howieDeal = { ...fromUser.howieDeal }
    if (!howieDeal.total) {
      // start it son!
      howieDeal.total = balance
      howieDeal.remaining = (balance || 0) * ((howieDeal.percent || 0) / 100)
      await updateUser(fromUser.id, {
        howieDeal: { total: howieDeal.total, remaining: howieDeal.remaining },
      })
    }
    if (howieDeal.remaining && howieDeal.remaining < amount) {
      throw new APIValidationError('howie__deal_amount', [
        `${Math.floor(howieDeal.remaining).toFixed(0)}`,
      ])
    } else {
      await updateUser(fromUser.id, {
        howieDeal: { remaining: (howieDeal.remaining || 0) - amount },
      })
    }
  }

  await deductFromBalance({
    user: fromUser,
    amount,
    balanceTypeOverride: balanceType,
    transactionType: 'tip',
    meta: { toName: toUser.name, toId: toUser.id },
  })

  await creditBalance({
    user: toUser,
    amount,
    balanceTypeOverride: balanceType,
    transactionType: 'tip',
    meta: { fromName: fromUser.name, fromId: fromUser.id },
  })

  await postTipHooks({ fromUser, toUser, amount, isPrivate, note, balanceType })
}
