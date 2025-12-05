import merge from 'deepmerge'
import { type DeepPartial, type PickKeys } from 'ts-essentials'

import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'
import { isObject } from 'src/util/helpers/object'
import { type RequireAtLeastOne } from 'src/util/helpers/types'

/**
 * We need this instead of satisfies so we can give narrower types to fields in defaultSettings without using type
 * assertions. Satisfies would only help with type checking inline but not for things like GQL resolvers relying on
 * these types.
 */
const identity = <T>(value: T): T => value

export const defaultSettings = {
  app: {
    enabled: true,
    volume: 0,
  },
  bets: {
    enabled: true,
  },
  bitcoininstantdeposit: {
    enabled: false,
  },
  bitcoinwithdraw: {
    enabled: true,
  },
  blackjack: {
    volume: 1,
  },
  cashOptions: {
    enabled: true,
  },
  chat: {
    enabled: true,
  },
  coinflip: {
    // Coinflip is the only game that can be disabled.
    enabled: true,
    volume: 1,
  },
  crash: {
    volume: 1,
  },
  currency: {
    displayCurrency: identity<DisplayCurrency>('usd'),
    hideEmptyBalances: false,
  },
  deposit: {
    enabled: true,
  },
  hotbox: {
    volume: 1,
  },
  dice: {
    volume: 1,
  },
  ethereumwithdraw: {
    enabled: true,
  },
  fairness: {
    clientseed: 'changeThisSeed',
  },
  feed: {
    incognito: false,
  },
  hilo: {
    volume: 1,
  },
  instantdeposit: {
    enabled: false,
  },
  litecoinwithdraw: {
    enabled: true,
  },
  mines: {
    volume: 1,
  },
  linearmines: {
    volume: 1,
  },
  cashdash: {
    volume: 1,
  },
  music: {
    volume: 1,
  },
  overrideBetGoal: {
    enabled: false,
  },
  payopwithdraw: {
    enabled: true,
  },
  precredit: {
    enabled: true,
  },
  plinko: {
    enabled: true,
    volume: 1,
  },
  profile: {
    editable: {
      bio: '',
      discord: '',
      maskSensitiveData: false,
      showProfileInfo: true,
      showBio: true,
      showChart: true,
      showDiscord: true,
      showRefCount: true,
      showTotalWon: true,
      showTwitter: true,
      twitter: '',
    },
  },
  roobetlive: {
    enabled: false,
  },
  roulette: {
    volume: 1,
  },
  stats: {
    enabled: true,
  },
  surveys: {
    enabled: true,
  },
  tetherwithdraw: {
    enabled: true,
  },
  tip: {
    enabled: true,
  },
  towers: {
    volume: 1,
  },
  usdcwithdraw: {
    enabled: true,
  },
  withdraw: {
    enabled: true,
  },
  ripplewithdraw: {
    enabled: true,
  },
  dogecoinwithdraw: {
    enabled: true,
  },
  tronwithdraw: {
    enabled: true,
  },
} satisfies Record<string, Record<string, any>>

export type UserSystemSettings = typeof defaultSettings
export type SystemName = keyof UserSystemSettings
export type TogglableSystemName = PickKeys<
  UserSystemSettings,
  { enabled: boolean }
>
export type SystemSettingName<T extends SystemName> =
  keyof UserSystemSettings[T]
export type SystemSettingValue<
  T extends SystemName,
  U extends SystemSettingName<T>,
> = UserSystemSettings[T][U]
export type SystemSetting<T extends SystemName> = RequireAtLeastOne<
  UserSystemSettings[T]
>
// TODO figure out how to make RequireAtLeastOne, dynamic string keys not working
export type SystemSettingValuesUpdate = Partial<{
  [key in SystemName]: SystemSetting<key>
}>

export const isValidSystemName = (value: any): value is SystemName =>
  Object.keys(defaultSettings).includes(value)
export const isValidSystemSettingName = <T extends SystemName>(
  systemName: T,
  settingName: any,
): settingName is SystemSettingName<T> =>
  isValidSystemName(systemName) &&
  Object.keys(defaultSettings[systemName]).includes(settingName)

export const isValidSystemSetting = <
  T extends SystemName,
  V extends SystemSettingName<T>,
>(
  systemName: T,
  settingName: V,
  value: any,
): value is SystemSettingValue<T, V> =>
  isValidSystemSettingName(systemName, settingName) &&
  typeof defaultSettings[systemName][settingName] === typeof value

export const isTogglableSystemName = (
  systemName: SystemName,
): systemName is TogglableSystemName =>
  Object.keys(defaultSettings[systemName]).includes('enabled')

/**
 * Settings a user can edit themselves
 * @todo separate user editable settings from systems access cleanly
 */
const UserEditableSettingNames = [
  'volume',
  'incognito',
  'clientseed',
  'editable',
  'displayCurrency',
  'hideEmptyBalances',
] as const
export type UserEditableSettingName = (typeof UserEditableSettingNames)[number]
export const isUserEditableSettingName = (
  value: any,
): value is UserEditableSettingName => UserEditableSettingNames.includes(value)

export function getDefaultSetting<T extends SystemName>(
  systemName: T,
  settingName: SystemSettingName<T>,
) {
  assertValidSettingName(systemName, settingName)
  return defaultSettings[systemName][settingName]
}

export function fillInDefaults(
  settings: DeepPartial<UserSystemSettings> & { id: string },
) {
  return merge(defaultSettings, settings)
}

export function assertValidSettingName<T extends SystemName>(
  systemName: T,
  settingName: SystemSettingName<T>,
) {
  if (!isValidSystemSettingName(systemName, settingName)) {
    throw new Error('System setting by that name does not exist')
  }
  return true
}

export const isValidSystemSettingValues = (
  value: object,
): value is SystemSettingValuesUpdate => {
  if (!isObject(value)) {
    return false
  }

  const systemEntries = Object.entries(value)
  if (!systemEntries.length) {
    return false
  }

  return Object.entries(value).every(([systemName, systemSettings]) => {
    if (!isObject(systemSettings)) {
      return false
    }
    const settingEntries = Object.entries(systemSettings)
    if (!settingEntries.length) {
      return false
    }
    return settingEntries.every(([settingName, value]) => {
      return (
        isValidSystemName(systemName) &&
        isValidSystemSettingName(systemName, settingName) &&
        isValidSystemSetting(systemName, settingName, value)
      )
    })
  })
}
