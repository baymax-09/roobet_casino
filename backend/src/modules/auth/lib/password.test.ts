import { isPasswordValid } from './password'

describe('password.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('isUsernameValid', () => {
    it('does not accept values with fewer than 7 characters', async () => {
      const isValid = await isPasswordValid('abc%')
      expect(isValid).toBe(false)
    })

    it('accepts values with more than 7 characters', async () => {
      const isValid = await isPasswordValid('abcd1234')
      expect(isValid).toBe(true)
    })

    it('does not accept values with more than 100 characters', async () => {
      const isValid = await isPasswordValid(
        '11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111',
      )
      expect(isValid).toBe(false)
    })
  })
})
