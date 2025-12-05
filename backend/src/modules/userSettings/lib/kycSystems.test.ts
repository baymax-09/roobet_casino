import { isKycDeterministicSystemName } from './kycSystems'

describe('modules/systems/lib/settings_schema', function () {
  describe('#isKycDeterministicSystemName', function () {
    it('valid KYC system to return true', function () {
      const result = isKycDeterministicSystemName('deposit')
      expect(result).toBe(true)
    })

    it('invalid KYC system to return false', function () {
      const result = isKycDeterministicSystemName('blah')
      expect(result).toBe(false)
    })
  })
})
