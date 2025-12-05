import { type ChangeEvent } from 'rethinkdbdash'
import { type ValueOf } from 'ts-essentials'

import { type DBCollectionSchema } from 'src/modules'
import { type Types as UserTypes } from 'src/modules/user'
import { type TogglableSystemName } from 'src/modules/userSettings'
import { config, io, r, winston } from 'src/system'
import { sleep } from 'src/util/helpers/timer'
import { Cooldown, ValueCache } from 'src/util/redisModels'
import { recursiveChangefeedHandler } from 'src/util/rethink'
import { siteSettingsLogger } from '../lib/logger'

/**
 * This is here because the way the ACP handle(d) legacy systems
 */
const userSystemsToGlobalSystems = {
  app: 'App',
  bets: 'Bets',
  bitcoinwithdraw: 'BitcoinWithdraw',
  chat: 'Chat',
  crash: 'Crash',
  dice: 'Dice',
  ethereumwithdraw: 'EthereumWithdraw',
  litecoinwithdraw: 'LitecoinWithdraw',
  mines: 'Mines',
  precredit: 'Precredit',
  roobetlive: 'RoobetLive',
  roulette: 'Roulette',
  surveys: 'Surveys',
  tip: 'Tip',
  towers: 'Towers',
} as const

export type LegacySystemKey = `disabled${ValueOf<
  typeof userSystemsToGlobalSystems
>}`
type LegacyMappedSystemName = Extract<
  TogglableSystemName,
  keyof typeof userSystemsToGlobalSystems
>
export const isLegacyMappedSystemName = (
  value: TogglableSystemName,
): value is LegacyMappedSystemName =>
  Object.keys(userSystemsToGlobalSystems).includes(value)
export const systemNameToGlobalSystemKey = (
  systemName: LegacyMappedSystemName,
): LegacySystemKey => `disabled${userSystemsToGlobalSystems[systemName]}`

export type GlobalStatName = keyof SiteSettings['globalStats']

export type SiteSettings = {
  id: 'main'
  banner: string
  bannerLinkTitle: string
  bannerLink: string
  disabledWithdraws: Record<UserTypes.BalanceType, boolean>
  btcFees: {
    halfHourFee: number
    hourFee: number
  }
  globalStats: {
    allTimeNumBets: number
    allTimeTotalBet: number
    logins: number
    signups: number
    globalAmountWonPast24: number
    globalAmountBetPast24: number
  }
  depositMatch: number
  hidden?: object
} & Record<LegacySystemKey, boolean>

// dynamic app settings
const Settings = r.table<SiteSettings>('settings')

export async function getDynamicSettings(
  includeHidden = false,
): Promise<SiteSettings> {
  // non-null assertion here because there is only one record in this collection
  const settings = (await Settings.get('main').run())!
  if (!includeHidden) {
    delete settings.hidden
  }
  return settings
}

export async function setDynamicSettings(obj: Partial<SiteSettings>) {
  return await Settings.get('main').update(obj).run()
}

export async function changeSystemEnabledGlobal(
  systemName: LegacyMappedSystemName,
  enabled: boolean,
) {
  await setDynamicSettings({
    [systemNameToGlobalSystemKey(systemName)]: !enabled,
  })
}

export async function isGlobalSystemEnabled(
  systemName: LegacyMappedSystemName,
) {
  const settings = await getDynamicSettings()

  return !settings[systemNameToGlobalSystemKey(systemName)]
}

export async function setWithdrawStatus(
  withdrawName: UserTypes.BalanceType,
  disable: boolean,
) {
  return await Settings.get('main')
    .update({
      disabledWithdraws: {
        [withdrawName]: disable,
      },
    })
    .run()
}

export async function recordBetsAllTime(amount: number) {
  await ValueCache.incrBy('allTimeNumBets', 'allTimeNumBets', 1)
  await ValueCache.incrByFloat('allTimeTotalBet', 'allTimeTotalBet', amount)
}

export async function incrementAllTimeNumBets(amount: number) {
  await Settings.get('main')
    .update({
      globalStats: {
        // these [default] numbers were as of the time this feature got pushed -- Glazer @ 2021-08-31
        allTimeNumBets: r
          .row('globalStats')('allTimeNumBets')
          .add(amount)
          .default(166953),
      },
    })
    .run()
}

export async function incrementAllTimeTotalBet(amount: number) {
  await Settings.get('main')
    .update({
      globalStats: {
        // these [default] numbers were as of the time this feature got pushed -- Glazer @ 2021-08-31
        allTimeTotalBet: r
          .row('globalStats')('allTimeTotalBet')
          .add(amount)
          .default(869711.4229745168),
      },
    })
    .run()
}

export async function incrementGlobalStat(name: GlobalStatName, amount = 1) {
  return await Settings.get('main')
    .update({
      globalStats: {
        [name]: r.row('globalStats')(name).add(amount).default(amount),
      },
    })
    .run()
}

export async function setGlobalStat(name: GlobalStatName, amount = 1) {
  return await Settings.get('main')
    .update({
      globalStats: {
        [name]: amount,
      },
    })
    .run()
}

export async function createDefaultSettings() {
  siteSettingsLogger('createDefaultSettings', { userId: null }).info(
    'Inserting Default Settings',
    config.defaultSettings,
  )
  await Settings.insert(config.defaultSettings).run()
}

export async function tempSetBanner(newBanner: string, seconds = 60) {
  await setDynamicSettings({ banner: newBanner })
  await sleep(seconds * 1000)
  await setDynamicSettings({ banner: '' })
}

export async function setDepositMatchPercentage(matchValue: number) {
  if (matchValue < 0) {
    matchValue = 0
  }

  if (matchValue > 1) {
    matchValue = 1
  }

  const toUpdate = {
    depositMatch: matchValue,
  }

  await Settings.get('main').update(toUpdate).run()
}

export function stripSettingsTable(settings: SiteSettings) {
  return {
    globalStats: {
      allTimeNumBets: settings.globalStats
        ? settings.globalStats.allTimeNumBets
        : 0,
    },
    banner: settings.banner,
    bannerLink: settings.bannerLink,
    bannerLinkTitle: settings.bannerLinkTitle,
    disabledApp: settings.disabledApp,
  }
}

async function handleNewSetting(change: ChangeEvent<SiteSettings>) {
  if (change && change.new_val) {
    const res = await Cooldown.checkSet('settings', 1)
    if (res < 0) {
      delete change.new_val.hidden
      io.emit('settingsUpdated', stripSettingsTable(change.new_val))
    }
  }
}

function newSettingsFeed() {
  return Settings.changes().run()
}

async function settingsFeed() {
  const opts = {
    ...config.rethinkdb.changefeedReconnectOptions,
    changefeedName: 'settings',
    logger: winston,
  }
  await recursiveChangefeedHandler<SiteSettings>(
    newSettingsFeed,
    handleNewSetting,
    opts,
  )
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'settings',
  feeds: [settingsFeed],
}
