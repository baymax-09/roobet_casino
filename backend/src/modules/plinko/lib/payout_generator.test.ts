import {
  generateEveryPossiblePath,
  LIGHTNING_BOARD_ROW_NUMBERS,
} from './lightning_board'
import {
  generateLightningPayouts,
  getAllAdjustmentsNeededForCells,
  verifyAveragePayoutWithMultipliers,
} from './payout_generator'
import { getHolesProbabilities } from './board'

jest.mock('src/system', () => ({
  config: {},
}))

describe('modules/plinko/lib/payout_generator1', function () {
  describe('#generateLightningPayouts', function () {
    // return;

    const randomSeeds: string[] = [
      '0.74475762960612140.9059891847956754',
      '0.18901331400099820.08949820620879567',
      '0.163820625477676170.797782245338392',
    ]
    // for (let i = 0; i < 10; i++) {
    //   let seed = Math.random().toString()
    //   while (seed.length < 10) {
    //     seed = Math.random().toString()
    //   }
    //   let seed2 = Math.random().toString()
    //   while (seed2.length < 10) {
    //     seed2 = Math.random().toString()
    //   }
    //   randomSeeds.push(seed + seed2)
    // }
    const numberOfRows = LIGHTNING_BOARD_ROW_NUMBERS
    const { pathCells } = generateEveryPossiblePath(numberOfRows)
    const probabilities = getHolesProbabilities(numberOfRows)
    const edge =
      parseFloat(process.env.PLINKO_LIGHTNING_HOUSE_EDGE || '') || 4.0
    test.each(randomSeeds)(
      'generates array of payouts for lightning',
      function (hash) {
        const { payouts, multiplierCells } = generateLightningPayouts(
          hash,
          edge,
          pathCells,
          numberOfRows,
        )
        expect(
          payouts.every(payout => !isNaN(payout) && isFinite(payout)),
        ).toBe(true)
        const { result, message, payoutAverage } =
          verifyAveragePayoutWithMultipliers(
            numberOfRows,
            payouts,
            probabilities,
            edge,
            multiplierCells,
            pathCells,
          )
        const error_info =
          'Verification result: ' +
          message +
          ' with seed ' +
          hash +
          ' and multiplierCells: ' +
          JSON.stringify(multiplierCells)
        // console.log(`Verification result: ${result} ${message}`)
        if (!result) {
          console.log(error_info)
        }
        expect(!isNaN(payoutAverage) && isFinite(payoutAverage)).toBe(true)
        expect(result).toBe(true)
      },
    )
  })
})

describe('modules/plinko/lib/payout_generator2', function () {
  describe('#getAllAdjustmentsNeededForCells', function () {
    it('get all adjustments needed for cells', function () {
      const edge =
        parseFloat(process.env.PLINKO_LIGHTNING_HOUSE_EDGE || '') || 4.0

      const hash = 'sittingunderatree'
      const numberOfRows = 2

      const multiplierCells = [
        {
          row: 1,
          column: 0,
          multiplier: 2,
        },
      ]
      const payouts = [1, 1, 1]

      const probabilities = getHolesProbabilities(numberOfRows)
      const { pathCells } = generateEveryPossiblePath(numberOfRows)

      const payoutAdjustments = getAllAdjustmentsNeededForCells(
        pathCells,
        numberOfRows,
        multiplierCells,
        probabilities,
        payouts,
      )
      expect(
        payoutAdjustments.every(payout => !isNaN(payout) && isFinite(payout)),
      ).toBe(true)

      const sumOfAdjustments = payoutAdjustments.reduce(
        (acc, curr) => acc + curr,
        0,
      )
      expect(sumOfAdjustments).toBeCloseTo(4.5)
    })
  })
})
