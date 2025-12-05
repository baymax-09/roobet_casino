import {
  defaultSettings,
  getDefaultSetting,
  fillInDefaults,
  assertValidSettingName,
  isValidSystemName,
  isValidSystemSettingName,
  isValidSystemSetting,
  isTogglableSystemName,
  isUserEditableSettingName,
  isValidSystemSettingValues,
} from './settings_schema'

const validSystemName = 'app'
const validSettingName = 'enabled'
const validSettingValue = true
const invalidSystemName = '0xDEAD'
const invalidSettingName = '0xCAFE'
const invalidSettingValue = []

describe('modules/systems/lib/settings_schema', function () {
  describe('#isValidSystemName', function () {
    it('should return true for a valid system name', function () {
      const result = isValidSystemName(validSystemName)
      expect(result).toBe(true)
    })

    it('should return false for an invalid system name', function () {
      const result = isValidSystemName(invalidSystemName)
      expect(result).toBe(false)
    })
  })

  describe('#isValidSystemSettingName', function () {
    it('should return true for a valid system name/setting name', function () {
      const result = isValidSystemSettingName(validSystemName, validSettingName)
      expect(result).toBe(true)
    })

    it('should return false for an invalid setting name', function () {
      const result = isValidSystemSettingName(
        validSystemName,
        invalidSettingName,
      )
      expect(result).toBe(false)
    })
  })

  describe('#isValidSystemSetting', function () {
    it('should return true for a valid system name/setting name/setting value', function () {
      const result = isValidSystemSetting(
        validSystemName,
        validSettingName,
        validSettingValue,
      )
      expect(result).toBe(true)
    })

    it('should return false for an invalid setting value', function () {
      const result = isValidSystemSetting(
        validSystemName,
        validSettingName,
        invalidSettingValue,
      )
      expect(result).toBe(false)
    })
  })

  describe('#isTogglableSystemName', function () {
    it('should return true for a valid togglable system name', function () {
      const result = isTogglableSystemName('app')
      expect(result).toBe(true)
    })

    it('should return false for a not togglable system name', function () {
      const result = isTogglableSystemName('fairness')
      expect(result).toBe(false)
    })
  })

  describe('#isUserEditableSettingName', function () {
    it('should return true for a valid user editable setting name', function () {
      const result = isUserEditableSettingName('volume')
      expect(result).toBe(true)
    })

    it('should return false for an invalid user editable setting name', function () {
      const result = isUserEditableSettingName(invalidSettingName)
      expect(result).toBe(false)
    })
  })

  describe('#getDefaultSetting', function () {
    it('should return a default setting', function () {
      const result = getDefaultSetting('crash', 'volume')
      const expectedResult = defaultSettings.crash.volume
      expect(result).toEqual(expectedResult)
    })

    it('should throw an exception on invalid setting name', function () {
      expect(() => {
        getDefaultSetting('crash', 'bad_setting')
      }).toThrow()
    })

    it('should throw an exception on invalid system name', function () {
      expect(() => {
        getDefaultSetting('bad_system', 'volume')
      }).toThrow()
    })
  })

  describe('#fillInDefaults', function () {
    it('should give back a filled out settings', function () {
      const settings = {
        id: '123',
        crash: {
          volume: 2,
        },
        coinflip: {
          enabled: false,
        },
      }

      const expected = {
        id: '123',
        ...defaultSettings,
        crash: {
          volume: 2,
        },
        coinflip: {
          volume: 1,
          enabled: false,
        },
      }

      const result = fillInDefaults(settings)
      expect(result).toEqual(expected)
    })
  })

  describe('#assertValidSettingName', function () {
    it('should not throw an error for valid setting name', function () {
      expect(() => {
        assertValidSettingName('crash', 'volume')
      }).not.toThrow()
    })

    it('should throw an error for an invalid setting', function () {
      expect(() => {
        assertValidSettingName('crash', 'invalid')
      }).toThrow()
    })
  })

  describe('#isValidSystemSettingValues', function () {
    const simpleTestCases = [
      {
        desc: 'should return true for a valid set of system setting values',
        args: defaultSettings,
        expected: true,
      },
      {
        desc: 'should return false for an invalid user system setting values',
        args: {
          [invalidSystemName]: {
            [invalidSettingName]: invalidSettingValue,
          },
        },
        expected: false,
      },
      {
        desc: 'should return false for an invalid user system value',
        args: {
          [invalidSystemName]: invalidSettingValue,
        },
        expected: false,
      },
      {
        desc: 'should return false for an empty setting object',
        args: {
          [validSystemName]: {},
        },
        expected: false,
      },
      {
        desc: 'should return false for an empty object',
        args: {},
        expected: false,
      },
    ]

    it.each(simpleTestCases)('$desc', function ({ args, expected }) {
      expect(isValidSystemSettingValues(args)).toBe(expected)
    })
  })
})
