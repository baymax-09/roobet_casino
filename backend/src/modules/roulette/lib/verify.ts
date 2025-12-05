import { config } from 'src/system'
import { type VerifyData } from 'src/modules/game/types'
import { saltHash } from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import { APIValidationError } from 'src/util/errors'

import { gameResultFromHash } from './hash'

export async function rouletteVerify(data: VerifyData<'roulette'>) {
  if (!data.bet.hash) {
    throw new APIValidationError('No hash found on roulette bet')
  }

  const finalHash = saltHash('roulette', data.bet.hash)
  const gameResult = await gameResultFromHash(finalHash)

  // Possibly add a validation step here, and return whether the gameResult matches the gameResult on the bet.

  return {
    serverSeed: data.bet.hash,
    hashedServerSeed: null,
    nonce: null,
    clientSeed: config.roulette.salt,
    result: gameResult?.winningNumber,
  }
}
