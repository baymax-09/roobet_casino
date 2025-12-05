/**
 * Dice RTP tests
 *
 * @group dice/rtp
 * @group rtp
 * @group housegame
 */

import { rollNumber } from 'src/modules/game/lib/provably_fair/userGenerated'
import { calculatePayoutMultiplier, determineRollSuccess } from './payout'
import { saltWithClientSeed } from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import { DiceModes } from './dice_modes'

jest.mock('src/system', () => ({
  config: {},
}))

describe('modules/dice/lib/roll', function () {
  describe('#diceRoll', function () {
    const clientSeed = 'userGeneratedHash1234567890'
    const edge = parseFloat(process.env.DICE_HOUSE_EDGE || '1')

    const targetNumber = 20
    const targetNumberEnd = 40
    const targetNumber2 = 60
    const targetNumberEnd2 = 70

    // Iterate over all dice modes
    DiceModes.forEach(diceMode => {
      it(`validates dice roll rtp for ${diceMode} dice modes`, function () {
        const totalIterations = 1000000
        let totalPayout = 0
        for (let iterations = 0; iterations < totalIterations; iterations++) {
          const shuffleNonce = iterations
          const newHash = saltWithClientSeed(
            clientSeed,
            shuffleNonce.toString(),
          )
          const roll = rollNumber(newHash)
          const payoutMultiplier = calculatePayoutMultiplier(
            diceMode,
            edge,
            targetNumber,
            targetNumberEnd,
            targetNumber2,
            targetNumberEnd2,
          )
          const success = determineRollSuccess(
            roll,
            diceMode,
            targetNumber,
            targetNumberEnd,
            targetNumber2,
            targetNumberEnd2,
          )
          const payoutValue = success ? payoutMultiplier : 0
          totalPayout += payoutValue
        }

        const averagePayout = totalPayout / totalIterations
        const expectedPayout = (100 - edge) / 100
        expect(averagePayout).toBeCloseTo(expectedPayout, 2) // Max difference of 0.005 (0.5%)
      })
    })
  })

  describe('#diceRoll analytic', function () {
    const edge = parseFloat(process.env.DICE_HOUSE_EDGE || '1')

    const targetNumber = 20
    const targetNumberEnd = 40
    const targetNumber2 = 60
    const targetNumberEnd2 = 70

    // Iterate over all dice modes
    DiceModes.forEach(diceMode => {
      it(`Validates dice roll rtp for ${diceMode} dice mode analytically`, function () {
        const totalIterations = 10000
        let totalPayout = 0
        for (let iterations = 0; iterations < totalIterations; iterations++) {
          const roll = iterations * 0.01
          const payoutMultiplier = calculatePayoutMultiplier(
            diceMode,
            edge,
            targetNumber,
            targetNumberEnd,
            targetNumber2,
            targetNumberEnd2,
          )
          const success = determineRollSuccess(
            roll,
            diceMode,
            targetNumber,
            targetNumberEnd,
            targetNumber2,
            targetNumberEnd2,
          )
          const payoutValue = success ? payoutMultiplier : 0
          totalPayout += payoutValue
        }

        const averagePayout = totalPayout / totalIterations
        const expectedPayout = (100 - edge) / 100
        expect(averagePayout).toBeCloseTo(expectedPayout, 4) // Max difference of 0.00005 (0.005%)
      })
    })
  })
})
