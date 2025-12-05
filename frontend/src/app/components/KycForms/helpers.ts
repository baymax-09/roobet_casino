import i18n from 'i18next'

import { type KYCGet, type VerifiedKYCLevel, type User } from 'common/types'

import { type KYCStatus } from './types'

/**
 * This logic should be handled strictly on the backend,
 * however KYC overrides break this.
 */
export const isLevel1Complete = (kyc: KYCGet) => {
  const { kycLevel, firstName, lastName } = kyc

  return (
    kycLevel >= 1 &&
    ((firstName ?? '').trim() !== '' && (lastName ?? '').trim()) !== ''
  )
}

export const getStatusMessage = ({
  status,
  user,
  level,
}: {
  status: KYCStatus
  user?: User
  level: VerifiedKYCLevel
}): string | undefined => {
  if (status === 'unavailable') {
    return i18n.t('kycForm.level1')
  }

  if (status === 'rejected') {
    return i18n.t('kycForm.level234Rejected')
  }

  if (['complete', 'pending'].includes(status) && user?.userKYCOverrideLevel) {
    if ((user?.kycLevel ?? 0) >= user.userKYCOverrideLevel) {
      return i18n.t('kycForm.level234CompleteWithOverride', { level })
    }
  }

  if (status === 'complete') {
    return i18n.t('kycForm.level234Complete')
  }

  if (status === 'pending') {
    return i18n.t('kycForm.level234Submitted')
  }
}

export const getLevelStatus = (
  level: VerifiedKYCLevel,
  kyc: KYCGet,
): KYCStatus => {
  // Identity submission.
  if (level === 1) {
    if (kyc.kycLevel < 1) {
      return 'incomplete'
    }

    return 'complete'
  }

  // All levels > 1 require level 1 to be complete.
  if (kyc.kycLevel < 1) {
    return 'unavailable'
  }

  return kyc.levels?.[level]?.status ?? 'incomplete'
}
