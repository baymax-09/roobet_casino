import * as UserFixtures from './user'
import * as SettingsFixtures from './settings'
import * as TPGames from './tpGames'

export async function setup() {
  console.log('setting up test fixtures')
  await UserFixtures.testUsers()
  await SettingsFixtures.testSettings()
  await TPGames.create()
  console.log('setting up test fixtures - complete')
}
