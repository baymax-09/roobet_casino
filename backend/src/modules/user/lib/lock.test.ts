import moment from 'moment'

import { basicUserMock } from '../../../../test/mocks/user'
import * as UserModule from 'src/modules/user'

import { userIsLocked, timedLockUser, unlockUser, lockUser } from './lock'

jest.mock('src/modules/user', () => ({
  updateUser: jest.fn(),
  lockOrUnlockUser: jest.fn(),
}))

describe('lock.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('userIsLocked', () => {
    it('should evaluate undefined user as unlocked', async () => {
      const isUserLocked = await userIsLocked()
      expect(isUserLocked).toBe(false)
    })

    it('should evaluate if a user is locked until a time', async () => {
      const tomorrow = moment().add(1, 'days').toISOString()
      const user = {
        ...basicUserMock,
        lockedUntil: tomorrow,
      }
      const isUserLocked = await userIsLocked(user)
      expect(isUserLocked).toBe(true)
    })

    it('should evaluate if a user is locked until a time in the past', async () => {
      const yesterday = moment().subtract(1, 'days').toISOString()
      const user = {
        ...basicUserMock,
        lockedUntil: yesterday,
      }
      const isUserLocked = await userIsLocked(user)
      expect(isUserLocked).toBe(false)
    })

    it('should evaluate if a user is not locked', async () => {
      const user = {
        ...basicUserMock,
      }
      const isUserLocked = await userIsLocked(user)
      expect(isUserLocked).toBe(false)
    })
  })

  describe('timedLockuser', () => {
    it('should update the user with time', async () => {
      const spy = jest.spyOn(UserModule, 'updateUser')
      const timestamp = moment().toISOString()
      await timedLockUser('testuserid', 'test reason', timestamp)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith('testuserid', {
        lockedUntil: timestamp,
        lockReason: 'test reason',
      })
    })
  })

  describe('lockUser', () => {
    it('should update the user', async () => {
      const spy = jest.spyOn(UserModule, 'lockOrUnlockUser')
      await lockUser('testuserid', 'test reason')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith('testuserid', true, 'test reason')
    })
  })

  describe('unlockUser', () => {
    it('should update the user', async () => {
      const spy = jest.spyOn(UserModule, 'lockOrUnlockUser')
      await unlockUser('test')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith('test', false)
    })
  })
})
