import { rollNumber } from './userGenerated'
import { saltWithClientSeed } from './sharedAlgorithms'

jest.mock('src/system', () => ({
  config: {},
}))

describe('modules/game/lib/provably_fair/userGenerated', function () {
  describe('#rollNumber', function () {
    it('randomly generates a number between 0 and 99.99', function () {
      const seed = 'dynamoMonkey'
      const iterations = 100000
      let min = Infinity
      let max = -Infinity

      for (let index = 0; index < iterations; index++) {
        const newSeed = saltWithClientSeed(seed, index.toString())
        const roll = rollNumber(newSeed)
        min = Math.min(min, roll)
        max = Math.max(max, roll)
      }

      console.log(`min: ${min}, max: ${max}`)
      expect(min).toBeGreaterThanOrEqual(0)
      expect(max).toBeLessThanOrEqual(99.99)
    })
  })
})
