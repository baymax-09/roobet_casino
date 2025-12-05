import { type DeepPartial } from 'ts-essentials'

import { getKycForUser } from 'src/modules/fraud/kyc'
import { type User } from 'src/modules/user/types'
import { errorMap } from '../constants'
import {
  type PaymentIQTransactionType,
  type PaymentProvider,
  type AuthorizeRequest,
} from '../types'

interface ProviderRequirements {
  phone: true
  postalCode: true
  dob: true
}

const PROVIDER_REQUIREMENTS: DeepPartial<
  Record<
    PaymentProvider,
    Record<PaymentIQTransactionType, ProviderRequirements>
  >
> = {
  SaltarPay: {
    deposit: {
      phone: true,
      postalCode: true,
    },
    withdrawal: {
      phone: true,
      postalCode: true,
    },
  },
  CardPay: {
    withdrawal: {
      postalCode: true,
    },
  },
  Pay4Fun: {
    deposit: {
      phone: true,
    },
    withdrawal: {
      phone: true,
    },
  },
  Pay4FunGo: {
    deposit: {
      phone: true,
    },
    withdrawal: {
      phone: true,
    },
  },
  Skrill: {
    deposit: {
      phone: true,
      dob: true,
    },
    withdrawal: {
      phone: true,
      dob: true,
    },
  },
}

export const validateAuthorizeRequestForUser = async ({
  type,
  request,
  user,
}: {
  type: 'deposit' | 'withdrawal'
  request: AuthorizeRequest
  user: User
}): Promise<undefined | (typeof errorMap)[keyof typeof errorMap]> => {
  const kycDoc = await getKycForUser(user)

  const requirements = PROVIDER_REQUIREMENTS[request.provider]?.[type]

  // Verify postal code is present, if applicable.
  if (requirements?.postalCode && !kycDoc?.addressPostalCode) {
    return errorMap.USER_KYC_POSTAL_CODE_MISSING
  }

  // Verify phone is present, if applicable.
  if (requirements?.phone && !kycDoc?.phone) {
    return errorMap.USER_KYC_PHONE_MISSING
  }

  // Verify dob is present, if applicable.
  if (requirements?.dob && !kycDoc?.dob) {
    return errorMap.USER_KYC_DOB_MISSING
  }

  return undefined
}
