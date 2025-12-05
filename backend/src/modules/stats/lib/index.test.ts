import { basicUserMock } from '../../../../test/mocks/user'

import * as userSettingsModule from 'src/modules/userSettings'

import { shouldRecordStatsForUser } from './index'

jest.mock('src/modules/userSettings', () => ({
  isSystemEnabled: jest.fn(),
  SystemNames: {
    Stats: 'stats',
  },
}))

describe('index.ts', () => {
  beforeEach(() => {
    jest.spyOn(userSettingsModule, 'isSystemEnabled').mockReturnValue(true)
  })

  afterEach(() => {
    jest.spyOn(userSettingsModule, 'isSystemEnabled').mockRestore()
  })

  describe('shouldRecordStatsForUser', () => {
    it('should record if no user provided', async () => {
      const result = await shouldRecordStatsForUser()
      expect(result).toBe(true)
    })

    it('should record for basic user', async () => {
      const result = await shouldRecordStatsForUser()
      expect(result).toBe(true)
    })

    it('should not record if explictly disabled', async () => {
      jest.spyOn(userSettingsModule, 'isSystemEnabled').mockReturnValue(false)
      const result = await shouldRecordStatsForUser(basicUserMock)
      expect(result).toBe(false)
    })
  })
})
