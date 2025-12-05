import { sleep } from 'src/util/helpers/timer'
import { type VerifyData } from 'src/modules/game/types'
import { saltWithClientSeed } from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import { type BetHistoryDocument } from 'src/modules/bet/types'
import { endCurrentRoundForUser } from 'src/modules/game/lib/provably_fair/userGenerated'
import { APIValidationError } from 'src/util/errors'

import { getCashDashHistoryByBet } from '../documents/cash_dash_history'
import {
  CashDashRoundModel,
  getCashDashRoundById,
} from '../documents/cash_dash_rounds'
import { createTower } from './gameboard'
import { getActiveCashDashGameByUser } from '../documents/active_cash_dash_games'

export async function cashDashVerify(data: VerifyData<'cashdash'>) {
  const activeGame = await getActiveCashDashGameByUser(data.user.id)

  /*
   * We want to check if there's an active game BEFORE ending the round. If
   * there is, then we exit the function.
   */
  if (activeGame) {
    throw new APIValidationError('game__still_active')
  }

  await sleep(1000)
  const activeGameCheckTwo = await getActiveCashDashGameByUser(data.user.id)

  /*
   * We want to check if there's an active game BEFORE ending the round. If
   * there is, then we exit the function.
   */
  if (activeGameCheckTwo) {
    throw new APIValidationError('game__still_active')
  }

  const game = await getCashDashHistoryByBet(data.betId)

  if (!game) {
    throw new APIValidationError('game__too_old_to_verify')
  }

  const round = await getCashDashRoundById(data.bet.roundId || '')
  if (!round) {
    throw new APIValidationError('no__round')
  }

  let seed = round.seed
  const hash = round.hash
  if (!round.roundOver) {
    const endRound = await endCurrentRoundForUser(
      data.user,
      data.gameName,
      CashDashRoundModel,
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
  const gameBoard = createTower(game.difficulty, data.bet.betAmount, finalHash)
  return {
    serverSeed: seed,
    hashedServerSeed: hash,
    nonce: data.bet.nonce,
    clientSeed: data.bet.clientSeed,
    result: gameBoard,
  }
}

function buildFinalHash(roundSeed: string, bet: BetHistoryDocument) {
  const noncedSeed = `${bet.clientSeed} - ${bet.nonce}`
  return saltWithClientSeed(roundSeed, noncedSeed)
}
