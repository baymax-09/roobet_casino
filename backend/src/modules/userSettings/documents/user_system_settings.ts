import { type ChangeEvent } from 'rethinkdbdash'

import { type DBCollectionSchema } from 'src/modules'
import { config, io, r, winston } from 'src/system'
import { recursiveChangefeedHandler } from 'src/util/rethink'

import {
  fillInDefaults,
  isValidSystemSettingValues,
  type SystemName,
  type SystemSettingName,
  type UserSystemSettings as UserSystemSettingsType,
  type SystemSettingValuesUpdate,
  type SystemSettingValue,
  isValidSystemSetting,
} from '../lib/settings_schema'
import { userSettingsLogger } from '../lib/logger'

interface UserSystemSettingsDB extends UserSystemSettingsType {
  id: string
}

const UserSystemSettings = r.table<UserSystemSettingsDB>('user_system_settings')

export const updateSystemSettings = async (
  userId: string,
  systemSettingValues: SystemSettingValuesUpdate,
): Promise<UserSystemSettingsDB> => {
  if (!isValidSystemSettingValues(systemSettingValues)) {
    throw new Error('Invalid system settings')
  }

  // We use the userId as the id in this table, this line is not a mistake :(
  const result = await UserSystemSettings.get(userId)
    .update(systemSettingValues, { returnChanges: 'always' })
    .run()

  if (result.skipped) {
    const documentToInsert = fillInDefaults({
      // We use the userId as the id in this table, this line is not a mistake :(
      id: userId,
      ...systemSettingValues,
    })
    const insertResult = await UserSystemSettings.insert(documentToInsert, {
      returnChanges: 'always',
    }).run()

    return insertResult.changes[0].new_val
  }

  return result.changes[0].new_val
}

export async function updateSystemSetting<
  T extends SystemName,
  U extends SystemSettingName<T>,
>(
  userId: string,
  systemName: T,
  settingName: U,
  value: SystemSettingValue<T, U>,
) {
  const update: SystemSettingValuesUpdate = {
    [systemName]: {
      [settingName]: value,
    },
  }
  if (isValidSystemSetting(systemName, settingName, value)) {
    await updateSystemSettings(userId, update)
  }
}

async function handleNewCurrency(change: ChangeEvent<UserSystemSettingsDB>) {
  const initialChange = change && change.new_val && change.old_val === null
  const hasChange =
    initialChange ||
    (change && change.new_val.currency !== change.old_val.currency)
  const { id } = initialChange ? change.new_val : change.old_val
  if (hasChange) {
    // We use the userId as the id in this table, this line is not a mistake :(
    io.to(id).emit('currencyUpdated', change.new_val.currency)
  }
}

async function newSettingsFeed() {
  return await r
    .table<UserSystemSettingsDB>('user_system_settings')
    .changes()
    .run()
}

async function currencyFeed() {
  userSettingsLogger('currencyFeed', { userId: null }).silly(
    'Starting rethink.currency feed emitter',
  )
  const opts = {
    ...config.rethinkdb.changefeedReconnectOptions,
    changefeedName: 'currency',
    logger: winston,
  }
  await recursiveChangefeedHandler<UserSystemSettingsDB>(
    newSettingsFeed,
    handleNewCurrency,
    opts,
  )
}

export const getSystemSettingsForUserId = async (userId: string) => {
  // We use the userId as the id in this table, this line is not a mistake :(
  return await UserSystemSettings.get(userId).run()
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'user_system_settings',
  feeds: [currencyFeed],
}
