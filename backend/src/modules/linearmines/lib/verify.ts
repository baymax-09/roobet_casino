import { sleep } from 'src/util/helpers/timer'
import { type VerifyData } from 'src/modules/game/types'
import { saltWithClientSeed } from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import { endCurrentRoundForUser } from 'src/modules/game/lib/provably_fair/userGenerated'
import { buildGroup } from 'src/modules/game/lib/shuffle'
import { type BetHistoryDocument } from 'src/modules/bet/types'
import { APIValidationError } from 'src/util/errors'

import { getLinearMinesActiveGamesForUser } from '../documents/active_linear_mines_games'
import { getLinearMinesHistoryByBet } from '../documents/linear_mines_history'
import {
  LinearMinesRoundModel,
  getLinearMinesRoundById,
} from '../documents/linear_mines_round'
import { GROUP_SIZE, setOrderedGroup } from './linear_mines'

export async function linearMinesVerify(data: VerifyData<'linearmines'>) {
  const activeGames = await getLinearMinesActiveGamesForUser({
    userId: data.user.id,
  })

  /*
   * We want to check if there's an active game BEFORE ending the round. If
   * there is, then we exit the function.
   */
  if (activeGames && activeGames.length > 0) {
    throw new APIValidationError('game__still_active')
  }

  await sleep(1000)
  const activeGames2 = await getLinearMinesActiveGamesForUser({
    userId: data.user.id,
  })

  /*
   * We want to check if there's an active game BEFORE ending the round. If
   * there is, then we exit the function.
   */
  if (activeGames2 && activeGames2.length > 0) {
    throw new APIValidationError('game__still_active')
  }

  const minesGame = await getLinearMinesHistoryByBet(data.bet.betId)

  if (!minesGame) {
    throw new APIValidationError('game__too_old_to_verify')
  }

  const round = await getLinearMinesRoundById(data.bet.roundId || '')
  if (!round) {
    throw new APIValidationError('no__round')
  }

  let seed = round.seed
  const hash = round.hash
  if (!round.roundOver) {
    const endRound = await endCurrentRoundForUser(
      data.user,
      data.gameName,
      LinearMinesRoundModel,
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
  const shuffledGroup = buildGroup(GROUP_SIZE, finalHash)
  const orderedGroup = setOrderedGroup(minesGame.minesCount, shuffledGroup)

  return {
    serverSeed: seed,
    hashedServerSeed: hash,
    nonce: data.bet.nonce,
    clientSeed: data.bet.clientSeed,
    result: orderedGroup,
  }
}

function buildFinalHash(roundSeed: string, bet: BetHistoryDocument) {
  const noncedSeed = `${bet.clientSeed} - ${bet.nonce}`
  return saltWithClientSeed(roundSeed, noncedSeed)
}
