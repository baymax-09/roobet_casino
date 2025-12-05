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

import { JungleMinesRoundModel } from '../documents/jungle_mines_round'
import { getActiveJungleMinesGameByUserId } from '../documents/active_jungle_mines_games'
import { getJungleMinesHistoryByBet } from '../documents/jungle_mines_history'
import { GROUP_SIZE, setOrderedGroup } from './jungle_mines'

export async function jungleMinesVerify(data: VerifyData<'junglemines'>) {
  if (!data.bet.roundId) {
    return VerificationErrorMap.NO_ROUND_BET
  }

  const activeGame = await getActiveJungleMinesGameByUserId(data.user.id)

  /*
   * We want to check if there's an active game BEFORE ending the round. If
   * there is, then we exit the function.
   */
  if (activeGame) {
    return VerificationErrorMap.GAME_STILL_ACTIVE
  }

  await sleep(1000)
  const activeGameCheckTwo = await getActiveJungleMinesGameByUserId(
    data.user.id,
  )

  /*
   * We want to check if there's an active game BEFORE ending the round. If
   * there is, then we exit the function.
   */
  if (activeGameCheckTwo) {
    return VerificationErrorMap.GAME_STILL_ACTIVE
  }

  const jungleMinesGame = await getJungleMinesHistoryByBet(data.bet.betId)

  if (!jungleMinesGame) {
    return VerificationErrorMap.GAME_TOO_OLD
  }

  const { secretHash, publicHash } = generateRoundHash(
    'junglemines',
    data.bet.roundId,
  )
  const endRound = await endCurrentRoundForUser(
    data.user,
    data.gameName,
    JungleMinesRoundModel,
  )
  if (!endRound) {
    return VerificationErrorMap.NO_ROUND
  }

  const finalHash = buildFinalHash(secretHash, data.bet)
  const shuffledGroup = buildGroup(GROUP_SIZE, finalHash)
  const orderedGroup = setOrderedGroup(
    jungleMinesGame.minesCount,
    shuffledGroup,
  )

  return {
    serverSeed: secretHash,
    hashedServerSeed: publicHash,
    nonce: data.bet.nonce,
    clientSeed: data.bet.clientSeed,
    result: orderedGroup,
  }
}

function buildFinalHash(roundSeed: string, bet: BetHistoryDocument) {
  const noncedSeed = `${bet.clientSeed} - ${bet.nonce}`
  return saltWithClientSeed(roundSeed, noncedSeed)
}
