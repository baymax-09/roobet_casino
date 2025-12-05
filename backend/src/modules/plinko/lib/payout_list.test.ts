import { getHolesProbabilities, verifyPayoutAverage } from './board'
import { getPayoutList, ManualRiskLevels, RowNumbers } from './payout_list'
// import { config } from 'src/system'

jest.mock('src/system', () => ({
  config: {
    plinko: {
      edge: process.env.PLINKO_HOUSE_EDGE,
    },
  },
}))

describe('modules/plinko/lib/payout_list', function () {
  describe('#verifyAllPayoutLists', function () {
    it('verify payoult lists have correct rtp', function () {
      const edge = parseFloat(process.env.PLINKO_HOUSE_EDGE || '') // NOTE Should use config, but may break tests

      let failedTests = 0

      ManualRiskLevels.forEach((riskLevel, someNumber) => {
        RowNumbers.forEach(numberOfRows => {
          const probabilities = getHolesProbabilities(numberOfRows)
          const payoutArray = getPayoutList(numberOfRows, riskLevel, edge)
          expect(payoutArray).toHaveLength(numberOfRows + 1)

          const { result, message } = verifyPayoutAverage(
            payoutArray,
            probabilities,
            edge,
          )
          if (!result) {
            console.log(`${someNumber} ${message}`)
            failedTests++
          }
        })
      })

      expect(failedTests).toBe(0)
    })
  })
})
