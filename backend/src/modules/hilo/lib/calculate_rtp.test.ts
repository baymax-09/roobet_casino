/**
 * Hilo RTP tests
 *
 * @group hilo/rtp
 * @group rtp
 * @group housegame
 */

import { rollNumber } from 'src/modules/game/lib/provably_fair/userGenerated'
import { calculatePayoutMultiplier, determineRollSuccess } from './payout'
import { saltWithClientSeed } from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import { HiloModes } from './hilo_modes'

jest.mock('src/system', () => ({
  config: {},
}))

describe('modules/hilo/lib/roll', function () {
  describe('#hiloRoll', function () {
    const clientSeed = 'userGeneratedHash1234567890'
    const edge = parseFloat(process.env.HILO_HOUSE_EDGE || '1')

    const targetNumber = 20

    // Iterate over all hilo modes
    HiloModes.forEach(mode => {
      it('validates hilo roll RTP by simulating 1mil rolls', function () {
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
            mode,
            edge,
            targetNumber,
          )
          const success = determineRollSuccess(roll, mode, targetNumber)
          const payoutValue = success ? payoutMultiplier : 0
          totalPayout += payoutValue
        }

        const averagePayout = totalPayout / totalIterations
        const expectedPayout = (100 - edge) / 100
        expect(averagePayout).toBeCloseTo(expectedPayout, 2) // Max difference of 0.005 (0.5%)
      })
    })
  })
})
