import { sleep } from 'src/util/helpers/timer'
import { type VerifyData } from 'src/modules/game/types'
import { saltWithClientSeed } from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import {
  generateRoundHash,
  endCurrentRoundForUser,
} from 'src/modules/game/lib/provably_fair/userGenerated'
import { VerificationErrorMap } from 'src/modules/game'
import { buildGroup } from 'src/modules/game/lib/shuffle'
import { type BetHistoryDocument } from 'src/modules/bet/types'

import { getActiveMinesGameByUserId } from '../documents/active_mines_games'
import { getMinesHistoryByBet } from '../documents/mines_history'
import { MinesRoundModel } from '../documents/mines_round'
import { setOrderedGroup } from './mines'

export async function minesVerify(data: VerifyData<'mines'>) {
  if (!data.bet.roundId) {
    return VerificationErrorMap.NO_ROUND_BET
  }

  const activeGame = await getActiveMinesGameByUserId(data.user.id)

  /*
   * We want to check if there's an active game BEFORE ending the round. If
   * there is, then we exit the function.
   */
  if (activeGame) {
    return VerificationErrorMap.GAME_STILL_ACTIVE
  }

  await sleep(1000)
  const activeGameCheckTwo = await getActiveMinesGameByUserId(data.user.id)

  /*
   * We want to check if there's an active game BEFORE ending the round. If
   * there is, then we exit the function.
   */
  if (activeGameCheckTwo) {
    return VerificationErrorMap.GAME_STILL_ACTIVE
  }

  const minesGame = await getMinesHistoryByBet(data.bet.betId)

  if (!minesGame) {
    return VerificationErrorMap.GAME_TOO_OLD
  }

  const { secretHash, publicHash } = generateRoundHash(
    'mines',
    data.bet.roundId,
  )
  const endRound = await endCurrentRoundForUser(
    data.user,
    data.gameName,
    MinesRoundModel,
  )
  if (!endRound) {
    return VerificationErrorMap.NO_ROUND
  }

  const finalHash = buildFinalHash(secretHash, data.bet)
  const shuffledGroup = buildGroup(minesGame.gridCount, finalHash)
  const orderedGroup = setOrderedGroup(
    minesGame.minesCount,
    shuffledGroup,
    minesGame.gridCount,
  )

  return {
    serverSeed: secretHash,
    hashedServerSeed: publicHash,
    nonce: data.bet.nonce,
    clientSeed: data.bet.clientSeed,
    gridSize: minesGame.gridCount ?? 25,
    result: orderedGroup,
  }
}

function buildFinalHash(roundSeed: string, bet: BetHistoryDocument) {
  const noncedSeed = `${bet.clientSeed} - ${bet.nonce}`
  return saltWithClientSeed(roundSeed, noncedSeed)
}
