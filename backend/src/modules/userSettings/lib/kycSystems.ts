import { type User } from 'src/modules/user/types'
import { getKycForUser } from 'src/modules/fraud/kyc'
import { userSettingsLogger } from '../lib/logger'

import { getSystemSettings } from '../lib'
import { type TogglableSystemName } from './settings_schema'

interface KYCSystem {
  permitPending: boolean
}

type KYCDeterministicSystems = Partial<Record<TogglableSystemName, KYCSystem>>

export const KYC_DETERMINISTIC_SYSTEMS = {
  deposit: {
    permitPending: true,
  },
  bets: {
    permitPending: true,
  },
  tip: {
    permitPending: false,
  },
  // Cash withdraw.
  withdraw: {
    permitPending: false,
  },
  bitcoinwithdraw: {
    permitPending: true,
  },
  ethereumwithdraw: {
    permitPending: true,
  },
  litecoinwithdraw: {
    permitPending: true,
  },
  tetherwithdraw: {
    permitPending: true,
  },
  usdcwithdraw: {
    permitPending: true,
  },
  ripplewithdraw: {
    permitPending: true,
  },
  dogecoinwithdraw: {
    permitPending: true,
  },
  tronwithdraw: {
    permitPending: true,
  },
} satisfies KYCDeterministicSystems

type KYCDeterministicSystemName = keyof typeof KYC_DETERMINISTIC_SYSTEMS

export const isKycDeterministicSystemName = (
  systemName: any,
): systemName is KYCDeterministicSystemName => {
  return Object.keys(KYC_DETERMINISTIC_SYSTEMS).includes(systemName)
}

export const checkKycDeterministicSystemEnabled = async (
  user: User,
  systemName: TogglableSystemName,
): Promise<number | undefined> => {
  // If we can't make a decision about specified system, early return.
  if (!isKycDeterministicSystemName(systemName)) {
    return undefined
  }

  const { kycLevel = 0, kycRequiredLevel } = user

  // These rules only apply to users that have an required.
  if (!kycRequiredLevel) {
    return undefined
  }

  // These rules only apply to users that have an required >= 2.
  if (kycRequiredLevel < 2) {
    return undefined
  }

  // We need more information about the status of the required level to continue.
  const kyc = await getKycForUser(user)

  if (kyc.kycRestrictAccount === false) {
    return undefined
  }

  // If the required level is greater than the user's current level, lock system.
  if (kycRequiredLevel > kycLevel) {
    return kycRequiredLevel
  }

  const schema = KYC_DETERMINISTIC_SYSTEMS[systemName]

  const status = kyc.levels?.[kycRequiredLevel]?.status

  // If we do not have a status, we cannot make assertions about systems.
  if (!status) {
    userSettingsLogger('checkKycDeterministicSystemEnabled', {
      userId: user.id,
    }).error(`Failed to find level status`, { kyc })
    return undefined
  }

  // If complete, continue.
  if (status === 'complete') {
    return undefined
  }

  // We permit pending approvals for some systems.
  if (status === 'pending' && schema.permitPending) {
    return undefined
  }

  // All other statuses are not acceptable.
  return kycRequiredLevel
}

export const getKYCTransactionSystems = async (userId: User['id']) => {
  const systems = await getSystemSettings(userId)
  const kycTransactionSystems = Object.fromEntries(
    Object.entries(systems).filter(([systemName, _]) =>
      isKycDeterministicSystemName(systemName),
    ),
  )
  return kycTransactionSystems
}
