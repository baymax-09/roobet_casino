import { isUsernameValid } from './username'

describe('username.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('isUsernameValid', () => {
    it('does not accept special characters', async () => {
      const isValid = await isUsernameValid('abc%')
      expect(isValid).toBe(false)
    })

    it('alphanumeric is valid', async () => {
      const isValid = await isUsernameValid('abcd')
      expect(isValid).toBe(true)
    })
  })
})
