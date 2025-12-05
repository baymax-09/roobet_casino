import { describeHolesData, saveHolesData } from './analysis'
import {
  calculateBallPath,
  generateEveryPossiblePath,
  getHoleFromBallPath,
  getHolesProbabilitiesGivenCell,
  getPayoutAdjustmentsForCell,
  getProbabilityOfCell,
  LIGHTNING_BOARD_ROW_NUMBERS,
  type PathCell,
} from './lightning_board'
import { buildRandomBools } from '../../game/lib/shuffle'
import { saltWithClientSeed } from '../../game/lib/provably_fair/sharedAlgorithms'

jest.mock('src/system', () => ({
  config: {},
}))

describe.skip('modules/plinko/lib/lightning_board', function () {
  describe('#calculateBallPath', function () {
    it('generates array of coordinates for the ball path', function () {
      // NOTE We do not want this test to run on CI builds

      const hash = 'iwaswatchingavatarthelastairbenderwhenitypedthis'
      const totalIterations = 100000
      const holes: number[] = []
      const numberOfRows = 16
      for (let iterations = 0; iterations < totalIterations; iterations++) {
        const shuffleNonce = iterations
        const newHash = saltWithClientSeed(hash, shuffleNonce.toString())

        const rand_numbers = buildRandomBools(numberOfRows, newHash)
        const path = calculateBallPath(rand_numbers, numberOfRows)
        // console.log("path: %o", path);
        // visualizePath(path)
        const hole = getHoleFromBallPath(path)
        holes.push(hole)
        console.log('iter: ' + iterations)
      }
      describeHolesData(holes, numberOfRows)
      const fileName = `plinko_${numberOfRows}_${totalIterations}`
      saveHolesData(holes, fileName, 'holes')
    })
  })
})

describe('modules/plinko/lib/lightning_board0', function () {
  describe('#calculateBallPath', function () {
    it('generates array of coordinates for the ball path', function () {
      const hash = 'veryrandomhashyesyouare'
      const holes: number[] = []
      const numberOfRows = 16
      const shuffleNonce = 0
      const newHash = saltWithClientSeed(hash, shuffleNonce.toString())

      const rand_numbers = buildRandomBools(numberOfRows, newHash)
      const path = calculateBallPath(rand_numbers, numberOfRows)

      const expectedPath: PathCell[] = [
        { row: 1, column: 1 },
        { row: 2, column: 2 },
        { row: 3, column: 3 },
        { row: 4, column: 3 },
        { row: 5, column: 4 },
        { row: 6, column: 4 },
        { row: 7, column: 5 },
        { row: 8, column: 5 },
        { row: 9, column: 5 },
        { row: 10, column: 5 },
        { row: 11, column: 5 },
        { row: 12, column: 6 },
        { row: 13, column: 6 },
        { row: 14, column: 7 },
        { row: 15, column: 7 },
        { row: 16, column: 7 },
      ]

      expect(path).toEqual(expectedPath)
    })
  })
})

describe('modules/plinko/lib/lightning_board1', function () {
  describe('#getProbabilityOfCell', function () {
    it('returns probability of hitting given cell', function () {
      const cell_pairs = [
        {
          row: 1,
          column: 0,
          probability: 0.5,
        },
        {
          row: 2,
          column: 2,
          probability: 0.25,
        },
        {
          row: 3,
          column: 1,
          probability: 0.375,
        },
        {
          row: 4,
          column: 0,
          probability: 0.0625,
        },
      ]
      cell_pairs.forEach(cell => {
        const probability = getProbabilityOfCell(cell)
        expect(probability).toEqual(cell.probability)
      })
    })
  })
})

describe('modules/plinko/lib/lightning_board2', function () {
  describe('#getHolesProbabilitiesGivenCell', function () {
    it('returns probability of hitting given hole after hitting a cell', function () {
      const cell_pairs = [
        {
          row: 15,
          column: 0,
        },
      ]
      cell_pairs.forEach(cell => {
        const probability = getHolesProbabilitiesGivenCell(16, cell)
        // console.log("probabilities: ", probability)
        // expect(probability).toEqual(cell.probability)
      })
    })
  })
})

describe('modules/plinko/lib/lightning_board3', function () {
  describe('#getHolesProbabilitiesGivenCell', function () {
    it('returns an array of hole probabilities given multiplier cell', function () {
      const cell = {
        row: 4,
        column: 2,
        multiplier: 2,
      }
      const probabilities = getHolesProbabilitiesGivenCell(
        LIGHTNING_BOARD_ROW_NUMBERS,
        cell,
      )
      // expect sum of probabilities to be 1
      const sumOfProbabilities = probabilities.reduce((a, b) => a + b, 0)
      expect(sumOfProbabilities).toBe(1)
    })
  })
})

describe('modules/plinko/lib/lightning_board4', function () {
  describe('#getPayoutAdjustmentsForCell', function () {
    it('returns an array of needed adjustments for payouts from multiplier cell', function () {
      const cell = {
        row: 4,
        column: 2,
        multiplier: 2,
      }
      const adjustments = getPayoutAdjustmentsForCell(
        LIGHTNING_BOARD_ROW_NUMBERS,
        cell,
      )
      const sumOfAdjustments = adjustments.reduce((acc, cur) => acc + cur, 0)
      expect(sumOfAdjustments).toBeLessThanOrEqual(cell.multiplier)
      expect(sumOfAdjustments).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('modules/plinko/lib/lightning_board5', function () {
  describe('#generateEveryPossiblePath', function () {
    it('returns an array of every possible path', function () {
      const numRows = 8 // 16 makes this test really slow
      const combinations = Math.pow(2, numRows)
      const { pathBooleans } = generateEveryPossiblePath(numRows)
      expect(pathBooleans).toHaveLength(combinations)
      // Check duplicates

      const compareArrOrder = (arr1, arr2) => {
        return arr1.join('') === arr2.join('')
      }
      // compare every array to every other array
      for (let i = 0; i < pathBooleans.length; i++) {
        for (let j = 0; j < pathBooleans.length; j++) {
          if (i != j) {
            const result = compareArrOrder(pathBooleans[i], pathBooleans[j])
            if (result) {
              console.log('duplicate: ', pathBooleans[i], pathBooleans[j])
            }
            expect(result).toBe(false)
          }
        }
      }
    })
  })
})
