import {
  type CookieItemParams,
  type CookieItemSameSites,
  getCookieItem,
  hasCookieItem,
  removeCookieItem,
  setCookieItem,
} from './cookies'

describe('cookies.ts', () => {
  describe('hasCookieItem', () => {
    beforeEach(() => {
      removeCookieItem('test-cookie')
    })

    it('hasCookieItem should return true if the cookie exists', () => {
      setCookieItem({ key: 'test-cookie', value: 'test-value' })
      expect(hasCookieItem('test-cookie')).toBe(true)
    })

    it('hasCookieItem should return false if the cookie does not exist', () => {
      expect(hasCookieItem('non-existent-cookie')).toBe(false)
    })
  })

  describe('getCookieItem', () => {
    const cases = [
      {
        name: 'should return null if the cookie does not exist',
        inputs: { cookie: { key: 'non-existent-cookie', value: null } },
        expectations: { cookie: null, throws: false },
      },
      {
        name: 'should return the value if the cookie exists (simple)',
        inputs: { cookie: { key: 'my-cookie', value: 'something' } },
        expectations: { cookie: { value: 'something' }, throws: false },
      },
      {
        name: 'should return the value if the cookie exists (complex)',
        inputs: {
          cookie: {
            key: 'my-cookie',
            value: 'something',
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            path: '/',
            domain: 'example.com',
            secure: true,
            sameSite: 'none' as CookieItemSameSites,
          },
        },
        expectations: {
          cookie: {
            key: 'my-cookie',
            value: 'something',
          },
          throws: false,
        },
      },
    ]

    it.each(cases)('getCookieItem $name', ({ inputs, expectations }) => {
      if (inputs.cookie.key && inputs.cookie.value) {
        setCookieItem(inputs.cookie)
      }

      if (expectations.throws) {
        expect(() => getCookieItem(inputs.cookie.key)).toThrow()
      } else {
        let value: CookieItemParams | null = null
        expect(() => (value = getCookieItem(inputs.cookie.key))).not.toThrow()
        if (!expectations.cookie) {
          expect(value).toBeNull()
        } else {
          expect(value).toMatchObject(expectations.cookie)
        }
      }
    })
  })

  describe('removeCookieItem', () => {
    const cases = [
      {
        name: 'should remove the cookie if it exist',
        inputs: { cookie: { key: 'my-cookie', value: 'something' } },
        expectations: { throws: false, exists: false },
      },
      {
        name: 'should be silent if the cookie does not exist',
        inputs: { cookie: { key: 'my-cookie' } },
        expectations: { throws: false, exists: false },
      },
    ]

    it.each(cases)('removeCookieItem $name', ({ inputs, expectations }) => {
      if (inputs.cookie.key && inputs.cookie.value) {
        setCookieItem(inputs.cookie)
      }

      if (expectations.throws) {
        expect(() => removeCookieItem(inputs.cookie.key)).toThrow()
      } else {
        expect(() => removeCookieItem(inputs.cookie.key)).not.toThrow()
        const cookie = getCookieItem(inputs.cookie.key)
        if (!expectations.exists) {
          expect(cookie).toBeNull()
        } else {
          expect(cookie).not.toBeNull()
        }
      }
    })
  })
})
