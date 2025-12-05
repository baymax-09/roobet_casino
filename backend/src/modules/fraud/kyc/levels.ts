import moment from 'moment'
import iso3311a2 from 'iso-3166-1-alpha-2'

import { UserDocuments } from 'src/modules/user'

import {
  type KycVerificationResult,
  type VerifiedKYCLevel,
  type KycVerificationFailure,
  type KYCRecord,
} from './types'

export const MIN_AGE_REQUIREMENT = 18

export const failure = (
  level: VerifiedKYCLevel,
  error: string,
  reject = false,
): KycVerificationResult => ({
  validationResult: {
    level,
    reject,
    verified: false,
    pending: false,
    failures: [{ error }],
  },
  level: {
    status: reject ? 'rejected' : 'incomplete',
    error,
  },
})

export const success = (level: VerifiedKYCLevel): KycVerificationResult => ({
  validationResult: {
    level,
    verified: true,
    pending: false,
    failures: [],
  },
  level: {
    status: 'complete',
  },
})

export const pending = (
  level: VerifiedKYCLevel,
  verified = false,
  error?: string,
): KycVerificationResult => ({
  validationResult: {
    level,
    reject: false,
    verified,
    pending: true,
    failures: error ? [{ error }] : [],
  },
  level: {
    status: 'pending',
    error,
  },
})

export const verifyLevel1 = async (
  _: string,
  kyc: KYCRecord,
): Promise<KycVerificationResult> => {
  const requiredFields: Readonly<Array<keyof KYCRecord>> = [
    'firstName',
    'lastName',
    'addressLine1',
    'addressCountry',
    'dob',
    'addressCity',
    'addressState',
  ]

  const failures: KycVerificationFailure[] = []

  for (const field of requiredFields) {
    const value = kyc[field]

    if (typeof value === 'string' && value.length < 2) {
      failures.push({ field, error: 'length_too_short' })
    }
  }

  if (!kyc.addressCountry || !iso3311a2.getCountry(kyc.addressCountry)) {
    failures.push({ field: 'addressCountry', error: 'invalid_country_code' })
  }

  if (kyc.dob && !moment(kyc.dob, 'DD/MM/YYYY').isValid()) {
    failures.push({ field: 'dob', error: 'invalid_dob' })
  }

  if (kyc.dob && moment().diff(moment(kyc.dob, 'DD/MM/YYYY'), 'years') < 18) {
    failures.push({ field: 'dob', error: 'under_18' })
  }

  const verified = failures.length === 0

  return {
    validationResult: {
      verified,
      level: 1,
      failures,
    },
    level: {
      status: verified ? 'complete' : 'incomplete',
    },
  }
}

// Identity verification.
export const verifyLevel2 = async (
  userId: string,
): Promise<KycVerificationResult> => {
  const documents = await UserDocuments.getDocuments({
    userId,
    type: 'identity',
    deleted: { $ne: true },
  })

  const latest = documents[0]

  if (!latest) {
    return failure(2, 'no_approved_identity')
  }

  if (latest.status === UserDocuments.StatusMap.APPROVED) {
    return success(2)
  }

  if (latest.status === UserDocuments.StatusMap.REJECTED) {
    return failure(2, 'identity_rejected', true)
  }

  return pending(2)
}

// Proof of address.
export async function verifyLevel3(
  userId: string,
): Promise<KycVerificationResult> {
  const documents = await UserDocuments.getDocuments({
    userId,
    // The veriff document type is no longer actively used, but necessary for existing
    // records. Ideally, we run a migration to rename the type.
    type: { $in: ['address', 'veriff-poa-image-address-front'] },
    deleted: { $ne: true },
  })

  const latest = documents[0]

  if (!latest) {
    return failure(3, 'no_approved_address')
  }

  if (latest.status === UserDocuments.StatusMap.APPROVED) {
    return success(3)
  }

  if (latest.status === UserDocuments.StatusMap.REJECTED) {
    return failure(3, 'address_rejected', true)
  }

  return pending(3)
}

// Proof of funds.
export async function verifyLevel4(
  userId: string,
): Promise<KycVerificationResult> {
  const documents = await UserDocuments.getDocuments({
    userId,
    type: 'sof',
    deleted: { $ne: true },
  })

  const latest = documents[0]

  if (!latest) {
    return failure(4, 'sof_missing')
  }

  if (latest.status === UserDocuments.StatusMap.APPROVED) {
    return success(4)
  }

  if (latest.status === UserDocuments.StatusMap.REJECTED) {
    return failure(4, 'sof_rejected', true)
  }

  return pending(4)
}
