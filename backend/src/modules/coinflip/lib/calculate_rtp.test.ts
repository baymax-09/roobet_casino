/**
 * Coinflip RTP tests
 *
 * @group coinflip/rtp
 * @group rtp
 * @group housegame
 */

import { createFinalHashSolo, flip } from './resolution'
import { saltWithClientSeed } from 'src/modules/game/lib/provably_fair/sharedAlgorithms'

jest.mock('src/system', () => ({
  config: {},
}))

describe('modules/coinflip/lib/game', function () {
  describe('#flip', function () {
    const clientSeed = 'userGeneratedHash1234567890'
    // let edge = parseFloat(process.env.COINFLIP_HOUSE_EDGE || '4')

    it('calculates flip result from game final hash', function () {
      const totalIterations = 1000000
      let totalPayout = 0
      for (let iterations = 0; iterations < totalIterations; iterations++) {
        const shuffleNonce = iterations
        const roundHash = saltWithClientSeed(
          'coinflip',
          shuffleNonce.toString(),
        )
        const { gameFinalHash } = createFinalHashSolo(
          clientSeed,
          roundHash,
          shuffleNonce,
        )
        const gameOutcome = flip(gameFinalHash) === 'heads' ? 1 : 0
        totalPayout += gameOutcome
      }

      const averagePayout = totalPayout / totalIterations
      const expectedPayout = 0.5
      expect(averagePayout).toBeCloseTo(expectedPayout, 2) // Max difference of 0.005 (0.5%)
    })
  })
})
