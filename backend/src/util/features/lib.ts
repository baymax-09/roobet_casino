import {
  type DBUser,
  type User,
  isDevelopmentBalanceType,
} from 'src/modules/user/types'
import { isRoleAccessPermitted } from 'src/modules/rbac'

import { getAllFeatureFlags, getFeatureFlag } from './documents/featureFlag'
import { type FeatureFlag, type FeatureName } from './types'

interface AccessFeatureArgs {
  countryCode: string
  user?: User | DBUser
}

interface SingleAccessFeatureArgs extends AccessFeatureArgs {
  featureName: FeatureName
}

interface TokenAccessFeatureArgs extends AccessFeatureArgs {
  token: string
}

interface CanUserAccessFeatureArgs extends AccessFeatureArgs {
  featureFlag: FeatureFlag
}

/** this is agnostic of any user, so we only care if the feature is disabled or not */
export async function isFeatureAvailable(name: FeatureName): Promise<boolean> {
  const flag = await getFeatureFlag(name)
  return flag !== null && !flag.disabled
}

export async function determineUserFeatureAccess({
  countryCode,
  user,
}: AccessFeatureArgs): Promise<Partial<Record<FeatureName, true>>> {
  const userAccess: Partial<Record<FeatureName, true>> = {}

  const featureFlags = await getAllFeatureFlags()

  for (const featureFlag of featureFlags) {
    const isEnabled = await canUserAccessFeature({
      featureFlag,
      user,
      countryCode,
    })

    if (isEnabled) {
      userAccess[featureFlag.name] = true
    }
  }

  return userAccess
}

export const canUserAccessFeatures = async (
  featureNames: FeatureName[],
  user: User | undefined,
  countryCode: string,
) => {
  const userAccess = await determineUserFeatureAccess({ countryCode, user })
  return featureNames.every(featureName => userAccess[featureName])
}

export async function determineUserTokenFeatureAccess({
  token,
  user,
  countryCode,
}: TokenAccessFeatureArgs): Promise<boolean> {
  if (isDevelopmentBalanceType(token)) {
    return await determineSingleFeatureAccess({
      featureName: token,
      user,
      countryCode,
    })
  }
  return true
}

export async function determineSingleFeatureAccess({
  featureName,
  user,
  countryCode,
}: SingleAccessFeatureArgs): Promise<boolean> {
  const featureFlag = await getFeatureFlag(featureName)

  if (!featureFlag) {
    return false
  }

  return await canUserAccessFeature({ featureFlag, user, countryCode })
}

export async function getBetaUserIdsWithFeatureFlag(
  featureName: FeatureName,
): Promise<string[]> {
  const featureFlag = await getFeatureFlag(featureName)

  if (!featureFlag) {
    return []
  }

  return featureFlag.betaTesters
}

export async function canUserAccessFeature({
  featureFlag,
  user,
  countryCode,
}: CanUserAccessFeatureArgs): Promise<boolean> {
  if (!featureFlag || featureFlag.disabled) {
    return false
  }

  const isAlphaTester = user?.roles?.length
    ? await isRoleAccessPermitted({
        user,
        requests: [{ resource: 'feature_flags', action: 'read_alpha' }],
      })
    : false

  if (featureFlag.state === 'alpha') {
    return isAlphaTester
  }

  const isBetaTester = (() => {
    // If we have a list of beta testers, check that list.
    if (user && featureFlag.betaTesters.length) {
      return featureFlag.betaTesters.includes(user.id)
    }

    // Else, if the beta testers list is empty, show to all VIPs and HVs.
    // Why? Couldn't tell you- We should add this as an option in the schema.
    return !!user && (user.role === 'VIP' || user.role === 'HV')
  })()

  if (featureFlag.state === 'beta') {
    return isAlphaTester || isBetaTester
  }

  // If the list is empty or missing, all regions are available.
  const isRegionAllowed =
    !featureFlag.regionList.length ||
    featureFlag.regionList.includes(countryCode)

  if (featureFlag.state === 'final') {
    return isAlphaTester || isBetaTester || isRegionAllowed
  }

  return false
}
