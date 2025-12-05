import * as KYC from 'src/modules/fraud/kyc'
import { APIValidationError } from 'src/util/errors'
import { type Types as UserTypes } from 'src/modules/user'
import {
  getDynamicSettings,
  systemNameToGlobalSystemKey,
  isLegacyMappedSystemName,
} from 'src/modules/siteSettings'

import {
  updateSystemSetting,
  updateSystemSettings,
  getSystemSettingsForUserId,
} from '../documents/user_system_settings'
import {
  type SystemSettingName,
  type SystemName,
  isUserEditableSettingName,
  type TogglableSystemName,
  type SystemSettingValue,
  type SystemSettingValuesUpdate,
  type UserEditableSettingName,
  getDefaultSetting,
  fillInDefaults,
  assertValidSettingName,
} from './settings_schema'
import { checkKycDeterministicSystemEnabled } from './kycSystems'

export type UserSystemStatus =
  | {
      enabled: true
    }
  | {
      enabled: false
      requiredKycLevel?: number
    }

/** Private function for fetching defaulted system settings */
async function getValidatedSystemSetting<T extends SystemName>(
  userId: string,
  systemName: T,
  settingName: SystemSettingName<T>,
) {
  assertValidSettingName(systemName, settingName)

  try {
    const settings = await getSystemSettingsForUserId(userId)

    if (
      !settings ||
      settings[systemName] === undefined ||
      settings[systemName][settingName] === undefined
    ) {
      return getDefaultSetting(systemName, settingName)
    } else {
      return settings[systemName][settingName]
    }
  } catch (error) {
    return getDefaultSetting(systemName, settingName)
  }
}

/** Public function for fetching system settings EXCEPT for checking if a togglable system is enabled. */
export async function getSystemSetting<T extends SystemName>(
  userId: string,
  systemName: T,
  /**
   * Don't use to check if a system is enabled, that should be dynamically checked with
   * checkSystemEnabledSafely, checkSystemEnabled, isSystemEnabled, or checkGameEnabled.
   */
  settingName: Exclude<SystemSettingName<T>, 'enabled'>,
) {
  return await getValidatedSystemSetting(userId, systemName, settingName)
}

export async function getSystemSettings(userId: string) {
  const settings = await getSystemSettingsForUserId(userId)
  return fillInDefaults(settings === null ? { id: userId } : settings)
}

export async function isSystemEnabled(
  user: UserTypes.User,
  systemName: TogglableSystemName,
) {
  try {
    return await checkSystemEnabled(user, systemName)
  } catch {
    return false
  }
}

export async function checkSystemEnabledSafely(
  user: UserTypes.User,
  systemName: TogglableSystemName,
): Promise<UserSystemStatus> {
  const kycCondition = systemName === 'bets' || systemName === 'tip'

  if (kycCondition) {
    // check KYC
    const { shouldLockBets, neededKycLevel } = KYC.checkUserNeedsKyc(user)

    if (shouldLockBets) {
      // this should really be happening outside of this function
      // TODO refactor this out when KYC is moved out of here
      await changeSystemEnabledUser(user.id, 'bets', false)

      return {
        enabled: false,
        requiredKycLevel: neededKycLevel,
      }
    }
  }

  // Check KYC deterministic system status.
  const requiredKycLevel = await checkKycDeterministicSystemEnabled(
    user,
    systemName,
  )

  if (typeof requiredKycLevel === 'number') {
    return {
      enabled: false,
      requiredKycLevel,
    }
  }

  const isLegacyGlobalSystemMappedKey = isLegacyMappedSystemName(systemName)

  const result = await getValidatedSystemSetting(user.id, systemName, 'enabled')

  if (!result) {
    return { enabled: false }
  }

  const settings = await getDynamicSettings()

  if (
    isLegacyGlobalSystemMappedKey &&
    settings[systemNameToGlobalSystemKey(systemName)]
  ) {
    return { enabled: false }
  }

  return { enabled: true }
}

/** @todo remove throw for kyc__needed. */
export async function checkSystemEnabled(
  user: UserTypes.User,
  systemName: TogglableSystemName,
): Promise<boolean> {
  const result = await checkSystemEnabledSafely(user, systemName)

  if (!result.enabled && result.requiredKycLevel) {
    throw new APIValidationError('kyc__needed', [`${result.requiredKycLevel}`])
  }

  return result.enabled
}

/*
checking the receiving user system's setting for another user's action
kyc required isn't useful for the acting user to know
*/
export async function checkReceivingUserEnabled(
  user: UserTypes.User,
  systemName: TogglableSystemName,
): Promise<boolean> {
  const result = await checkSystemEnabledSafely(user, systemName)

  return result.enabled
}

export async function changeSystemEnabledUser<T extends TogglableSystemName>(
  userId: string,
  systemName: T,
  enabled: SystemSettingValue<T, 'enabled'>,
) {
  await updateSystemSetting(userId, systemName, 'enabled', enabled)
}

export const changeSystemsEnabledUser = async (
  userId: string,
  systemsToChange: TogglableSystemName[],
  enabled: boolean,
) => {
  const systemsSettingsValues =
    systemsToChange.reduce<SystemSettingValuesUpdate>(
      (values, name) => ({
        ...values,
        [name]: {
          enabled,
        },
      }),
      {},
    )

  await updateSystemSettings(userId, systemsSettingsValues)
}

export async function changeSystemSettingAsUser<
  T extends SystemName,
  U extends UserEditableSettingName & SystemSettingName<T>,
>(
  userId: string,
  systemName: T,
  settingName: U,
  value: SystemSettingValue<T, U>,
) {
  if (!isUserEditableSettingName(settingName)) {
    throw new APIValidationError('system__no_modify')
  }
  await updateSystemSetting(userId, systemName, settingName, value)
}
