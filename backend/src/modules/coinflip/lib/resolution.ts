import {
  generateHmac,
  saltWithClientSeed,
} from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import { buildRandomBools } from 'src/modules/game/lib/shuffle'

import { type CoinFlipOutcome } from '../documents/coinFlipGames'

export function createFinalHashSolo(
  clientSeed: string,
  hostRoundHash: string,
  hostNonce: number,
) {
  const hostSalt = `${clientSeed} - ${hostNonce}`

  const gameFinalHash = saltWithClientSeed(hostRoundHash, hostSalt)

  return { gameFinalHash }
}

export function createFinalHash(
  clientSeed: string,
  roundSeedAuthor: string,
  roundSeedComptetitor: string,
  hostNonce: number,
  guestNonce: number,
) {
  const guestSalt = `${clientSeed} - ${guestNonce}`
  const hostSalt = `${clientSeed} - ${hostNonce}`

  const roundHashAuthor = saltWithClientSeed(roundSeedAuthor, hostSalt)
  const roundHashCompetitor = saltWithClientSeed(
    roundSeedComptetitor,
    guestSalt,
  )

  const finalGamehash = generateHmac(roundHashAuthor, roundHashCompetitor)

  return {
    gameFinalHash: finalGamehash,
    hostFinalHash: roundHashAuthor,
    guestFinalHash: roundHashCompetitor,
  }
}

export function flip(hash: string): CoinFlipOutcome {
  const shuffledGroup: number[] = buildRandomBools(1, hash)
  const result = shuffledGroup[0] < 1 ? 'heads' : 'tails'
  return result
}
