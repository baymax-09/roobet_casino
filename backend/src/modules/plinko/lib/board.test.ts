import { getHolesProbabilities } from './board'
import { RowNumbers } from './payout_list'

jest.mock('src/system', () => ({
  config: {},
}))

describe('modules/plinko/lib/board', function () {
  describe('#getHolesProbabilities', function () {
    it('generates array of probablities for each plinko hole', function () {
      RowNumbers.forEach(rowNumbers => {
        console.log('Testing probabilities for rowNumbers: ', rowNumbers)
        const probabilities = getHolesProbabilities(rowNumbers)
        expect(probabilities).toHaveLength(rowNumbers + 1)
        const sumOfProbabilities = probabilities.reduce((a, b) => a + b, 0)

        const expectedSum = 1
        const error = Math.abs(sumOfProbabilities - expectedSum)
        expect(error).toBeLessThan(0.01)
      })
    })
  })
})
