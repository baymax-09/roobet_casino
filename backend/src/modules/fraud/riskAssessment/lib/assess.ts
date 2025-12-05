import crypto from 'crypto'

import { config } from 'src/system'
import {
  fraudRequest,
  isEmailDomainDisposable,
  publishSeonHookEvent,
} from 'src/vendors/seon'
import { getUserPasswordForUser } from 'src/modules/auth'
import {
  RiskStatus,
  type Action,
  type SeonRequest,
  type SeonIpDetails,
  type SeonResponse,
  type KYCSeonRecord,
} from 'src/vendors/seon/types'
import { type BalanceType, type User } from 'src/modules/user/types'
import { type Currency } from 'src/modules/currency/types'
import { type DepositType } from 'src/modules/deposit/types'
import { type WithdrawalPluginType } from 'src/modules/withdraw/types'
import { getSelectedBalanceFromUser } from 'src/modules/user/balance'
import { type KYCRecord } from 'src/modules/fraud/kyc/types'

import { KYC } from '../../kyc'
import { addIpToIpTracer } from '../../geofencing'
import { getCRMByUserId } from 'src/modules/crm/documents/crm'
import {
  getBonusTransactionData,
  type TransactionType,
} from 'src/modules/user/documents/transaction'
import { getFlaggedWithdrawalsCount } from 'src/modules/withdraw/documents/withdrawals_mongo'
import { formatSeonDob } from '../util'
import { fraudLogger } from '../../lib/logger'

interface TransactionArgs {
  id?: string
  type: DepositType | WithdrawalPluginType | BalanceType
  amount: number
  currency: Currency
}

interface BaseRiskArgs {
  ip: string
  user: User
  actionType: Action

  transaction?: TransactionArgs
  session?: { id: string; data: string }
  customFields?: object
}

export interface AssessRiskResponse {
  id?: string
  state: RiskStatus
  score: number
  ipDetails: SeonIpDetails | Record<string, never>
  declineReason?: string
  seonResponse?: SeonResponse
}

/** this should only ever be used in TWO places
 * 1. IN THIS FILE
 * 2. When we pass a user's session ID to the FE
 */
export function formatSessionId(cookie: string) {
  return crypto.createHash('sha256').update(cookie).digest('hex')
}

/**
 * Handles generic fraud checks and risk assessment
 * This can be used for any user-driven event
 *
 * First build the necessary payloads, and then call the assessRisk function
 */
export function buildTransactionPayload(
  transaction: TransactionArgs,
): Partial<SeonRequest> {
  const { id, type, amount } = transaction
  return {
    transaction_id: id || '',
    transaction_type: type,
    transaction_amount: amount,
    transaction_currency: 'USD',
  }
}

export async function buildUserPayload(
  user: User,
  actionType: Action,
  customFields?: object,
): Promise<Partial<SeonRequest>> {
  const passwordSalt = config.seon.salt
  const lengthLimit = 99
  const userPasswordDoc = await getUserPasswordForUser(user.id)
  const hashedPassword =
    userPasswordDoc?.pass256 && passwordSalt
      ? crypto
          .createHmac('sha256', passwordSalt)
          .update(userPasswordDoc.pass256)
          .digest('hex')
      : ''
  const kycLevel = user.kycLevel || 0
  const balanceReturn = await getSelectedBalanceFromUser({ user })
  const createdAt = Math.floor(new Date(user.createdAt).getTime() / 1000)

  let kycPayload: KYCSeonRecord = {}
  const hasKycCustomFields = customFields && 'kyc' in customFields
  if (kycLevel > 0 || hasKycCustomFields) {
    const kyc = hasKycCustomFields
      ? (customFields.kyc as Partial<KYCRecord>)
      : await KYC.getForUser(user)
    if (hasKycCustomFields) {
      delete customFields.kyc
    }

    // We cannot send DOB until it is normalized. There are too many assumptions that need to be made,
    // And the data isn't formatted in any particular way.
    /*
     * // kyc.dob should be in format DD/MM/YYYY
     * const splitDOB = kyc.dob ? kyc.dob.split('/') : []
     * const year = splitDOB[2]
     * let month = splitDOB[1]
     * let day = splitDOB[0]
     * // I hate that we do this but our KYC data is not uniform
     * if (parseInt(month) > 12) {
     * month = splitDOB[0]
     * day = splitDOB[1]
     * }
     * // some kyc docs have last 2 digits for the year while others have 4, so we have to make an assumption here
     * const formattedDOB = splitDOB.length ? `${year.length === 2 ? `19${year}` : year}-${month}-${day}` : ''
     */

    kycPayload = {
      user_dob: formatSeonDob(kyc.dob),
      user_country: kyc.addressCountry?.substring(0, lengthLimit) || '',
      user_city: kyc.addressCity?.substring(0, lengthLimit) || '',
      user_zip: kyc.addressPostalCode?.substring(0, lengthLimit) || '',
      user_region: kyc.addressState?.substring(0, lengthLimit) || '',
      user_street: kyc.addressLine1?.substring(0, lengthLimit) || '',
      user_street2: kyc.addressLine2?.substring(0, lengthLimit) || '',
      phone_number: kyc.phone?.substring(0, 19) || '',
      user_firstname: kyc.firstName?.substring(0, lengthLimit) || '',
      user_lastname: kyc.lastName?.substring(0, lengthLimit) || '',
      user_fullname: `${kyc.firstName} ${kyc.lastName}` || '',
    }
  }

  const bonusFields = await appendBonusData(user, actionType)

  const payload = {
    affiliate_id: user.affiliateId || '',
    email: user.email || '',
    email_domain: user.email?.substring(user.email.lastIndexOf('@') + 1) || '',
    password_hash: hashedPassword,
    user_name: user.name,
    user_id: user.id,
    user_created: createdAt,
    user_verification_level: `${kycLevel}`,
    user_balance: balanceReturn.balance,
    user_dob: '',
    user_country: '',
    user_city: '',
    user_region: '',
    user_zip: '',
    user_street: '',
    user_street2: '',
    user_fullname: '',
    user_firstname: '',
    user_lastname: '',
    ...kycPayload,

    custom_fields: {
      user_total_deposits: user.hiddenTotalDeposits,
      user_total_deposit_amount: user.hiddenTotalDeposited,
      user_total_withdraw_amount: user.hiddenTotalWithdrawn,
      user_survey_credited: user.surveyCredited || 0,
      user_rain_credited: user.rainCredited || 0,
      user_is_hv: user.role === 'HV',
      user_is_vip: user.role === 'VIP',
      user_total_tipped: user.totalTipped || 0,
      user_total_tips_received: user.totalTipsReceived || 0,
      user_is_sponsor: !!user.isSponsor,
      user_affiliate_earnings: user.referralEarnings || 0,
      user_lifetime_value:
        user.hiddenTotalDeposited -
        user.hiddenTotalWithdrawn -
        (user.totalTipped - user.totalTipsReceived),
      user_ggr: user.hiddenTotalBet - user.hiddenTotalWon,
      user_total_wagered: user.hiddenTotalBet,
      user_total_sports_wagered: user.hiddenSportsTotalBet || 0,
      user_total_casino_wagered:
        user.hiddenTotalBet - (user.hiddenSportsTotalBet || 0),
      user_deposit_withdrawn_ratio: parseFloat(
        (user.hiddenTotalWithdrawn / user.hiddenTotalDeposited).toFixed(2),
      ),
      Risk_Check_Enabled: !user.bypassRiskCheck,
      Pending_Flagged_Withdrawals: await getFlaggedWithdrawalsCount({
        userId: user.id,
      }),
      ...customFields,
      ...bonusFields,
    },
  }

  return payload
}

/** This function should only be used for API driven Transactions */
export async function assessRisk({
  user,
  ip,
  actionType,
  session,
  transaction,
  customFields = {},
}: BaseRiskArgs): Promise<AssessRiskResponse> {
  const logger = fraudLogger('assessRisk', { userId: user.id })
  const resolvedCustomFields = { ...customFields }
  const userPayload = await buildUserPayload(
    user,
    actionType,
    resolvedCustomFields,
  )
  const transactionPayload = transaction
    ? buildTransactionPayload(transaction)
    : {}

  const request = {
    ip,
    session_id: session && session.id ? formatSessionId(session.id) : '',
    session: session && session.data ? session.data : '',
    ...userPayload,
    ...transactionPayload,
  }

  let response = null
  try {
    response = await fraudRequest(actionType, request)
  } catch (err) {
    logger.error(
      `assessRisk fraudRequest error - ${err.messages}`,
      { actionType, request },
      err,
    )
    return {
      state: RiskStatus.APPROVED,
      score: 0,
      ipDetails: {},
    }
  }
  if (!response) {
    return {
      state: RiskStatus.APPROVED,
      score: 0,
      ipDetails: {},
    }
  }

  if (isEmailDomainDisposable(actionType, response)) {
    return {
      state: RiskStatus.DECLINED,
      score: 0,
      ipDetails: {},
      declineReason: 'disposable_email_invalid',
    }
  }

  const {
    success,
    data: { id, state, fraud_score, ip_details },
  } = response

  if (success && ip_details && ip_details.ip) {
    await addIpToIpTracer({ ip: ip_details.ip, userId: user.id })
  }

  try {
    await publishSeonHookEvent({ userId: user.id, actionType, ...response })
  } catch (err) {
    logger.error(`assessRisk slack log err - ${err.messages}`, err)
  }

  /*
   * if success is false and there is no error... somehow
   * then we send back an APPROVED fraud check
   */

  return {
    id,
    state: success ? state : RiskStatus.APPROVED,
    score: success ? fraud_score : 0,
    ipDetails: success ? ip_details : {},
    seonResponse: response,
  }
}

const appendBonusData = async (user: User, actionType: Action) => {
  const affiliateTypes: Action[] = [
    'cash_deposit',
    'cash_withdraw',
    'tip',
    'crypto_deposit',
    'crypto_withdraw',
  ]

  if (!affiliateTypes.includes(actionType)) {
    return {}
  }

  const crm = await getCRMByUserId(user.id)

  const bonusTransactionTypes: TransactionType[] = [
    'promo',
    'koth',
    'bonus',
    'roowards',
    'marketingBonus',
  ]

  const bonusData = await getBonusTransactionData(
    user.id,
    bonusTransactionTypes,
  )

  return {
    ...(user.affiliateId && { AffiliateID_rooferrals: user.affiliateId }),
    ...(crm?.cxAffId && { Affiliate_ID: crm.cxAffId }),
    ...(bonusData?.totalAmount && {
      total_bonus_amount: bonusData.totalAmount,
    }),
    ...(bonusData?.count && { total_bonus_count: bonusData.count }),
  }
}
