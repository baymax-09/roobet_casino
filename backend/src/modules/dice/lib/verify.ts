import { type VerifyData } from 'src/modules/game/types'
import {
  endCurrentRoundForUser,
  rollNumber,
} from 'src/modules/game/lib/provably_fair/userGenerated'
import { type BetHistoryDocument } from 'src/modules/bet/types'
import { saltWithClientSeed } from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import { APIValidationError } from 'src/util/errors'

import { DiceRound } from '../documents'
import { scopedLogger } from 'src/system/logger'

export async function diceVerify(data: VerifyData<'dice'>) {
  const diceLogger = scopedLogger('dice')
  if (!data.bet.roundId) {
    diceLogger('diceVerify', { userId: data.user.id }).error(
      'No hash found on dice bet',
    )
    throw new APIValidationError('No hash found on roulette bet')
  }

  const round = await DiceRound.DiceRoundModel.findById(data.bet.roundId)
  if (!round) {
    throw new APIValidationError('no__round')
  }

  let seed = round.seed
  const hash = round.hash
  if (!round.roundOver) {
    const endRound = await endCurrentRoundForUser(
      data.user,
      data.gameName,
      DiceRound.DiceRoundModel,
    )
    if (!endRound) {
      throw new APIValidationError('no__round')
    }

    seed = endRound.hash
  }

  // This should never happen.
  if (!seed) {
    throw new APIValidationError('no__seed')
  }
  const finalHash = buildFinalHash(seed, data.bet)
  const roll = rollNumber(finalHash)

  return {
    serverSeed: seed,
    hashedServerSeed: hash,
    nonce: data.bet.nonce,
    clientSeed: data.bet.clientSeed,
    result: roll,
  }
}

function buildFinalHash(roundSeed: string, bet: BetHistoryDocument) {
  const noncedSeed = `${bet.clientSeed} - ${bet.nonce}`
  return saltWithClientSeed(roundSeed, noncedSeed)
}
