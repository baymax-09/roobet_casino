import * as KYC from 'src/modules/fraud/kyc'
import { formatSessionId } from 'src/modules/fraud/riskAssessment'
import { getUserSessionsByUser } from 'src/modules/auth/documents/user_session'
import { getUserById } from 'src/modules/user'

import { getCountryCode } from './util'
import { errorMap } from '../constants'
import { type VerifyUserRequest, type VerifyUserResponse } from '../types'
import { checkSystemEnabledSafely } from 'src/modules/userSettings'

/**
 * Invoked by /paymentIq/verifyUser webhook:
 * 1. Validate User
 * 2. Validate KYC Level
 * 3. Fetch KYC Data
 * 4. Return VerifyUserResponse
 *
 * @param {VerifyUserRequest}
 * @returns {VerifyUserResponse}
 */
async function verifyUserSession(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const sessions = await getUserSessionsByUser(userId)

  for (const session of sessions) {
    if (
      sessionId === formatSessionId(session.sessionId) &&
      !session.destroyed
    ) {
      return true
    }
  }

  return false
}

export const verifyUser = async (
  requestBody: VerifyUserRequest,
): Promise<VerifyUserResponse> => {
  const user = await getUserById(requestBody.userId)
  if (!user) {
    return {
      success: false,
      errCode: errorMap.USER_NOT_FOUND.errCode,
      errMsg: errorMap.USER_NOT_FOUND.errMsg,
      userId: requestBody.userId,
    }
  }

  if (!user.kycLevel || user.kycLevel < 1) {
    return {
      success: false,
      errCode: errorMap.USER_KYC_LEVEL_NOT_ALLOWED.errCode,
      errMsg: errorMap.USER_KYC_LEVEL_NOT_ALLOWED.errMsg,
      userId: requestBody.userId,
    }
  }

  const cashEnabled = await checkSystemEnabledSafely(user, 'cashOptions')

  if (!cashEnabled) {
    return {
      success: false,
      errCode: errorMap.DEPOSIT_USER_SYSTEM_DISABLED.errCode,
      errMsg: errorMap.DEPOSIT_USER_SYSTEM_DISABLED.errMsg,
      userId: requestBody.userId,
    }
  }

  const isValidSession = await verifyUserSession(user.id, requestBody.sessionId)
  if (!isValidSession) {
    return {
      success: false,
      errCode: errorMap.USER_SESSION_INVALID.errCode,
      errMsg: errorMap.USER_SESSION_INVALID.errMsg,
      userId: requestBody.userId,
    }
  }

  const {
    firstName = '',
    lastName = '',
    addressLine1,
    addressCity,
    addressState,
    addressPostalCode,
    addressCountry,
    phone,
  } = await KYC.getKycForUser(user)

  const payload = {
    userId: user.id,
    success: true,
    firstName,
    lastName,
    street: addressLine1,
    city: addressCity,
    state: addressState,
    zip: addressPostalCode,
    country: addressCountry ? getCountryCode(addressCountry) : 'N/A',
    email: user.email,
    phone,
    balance: user.cashBalance || 0.0,
    balanceCy: 'USD',
    locale: user.locale || 'en',
  }

  return payload
}
