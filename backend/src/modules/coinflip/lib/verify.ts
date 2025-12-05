import { config } from 'src/system'
import { saltWithNewSeed } from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import { endCurrentRoundForUser } from 'src/modules/game/lib/provably_fair/userGenerated'
import {
  GameVerificationError,
  type VerifyData,
  type HouseGameName,
  type VerificationFunctionResult,
} from 'src/modules/game/types'
import { VerificationErrorMap } from 'src/modules/game'

import {
  getCoinFlipGameById,
  type CoinFlipGame,
  getCoinFlipActiveGamesForUser,
} from '../documents/coinFlipGames'
import {
  getCoinFlipRoundById,
  CoinFlipRoundModel,
} from '../documents/coinFlipRound'
import { createFinalHash, createFinalHashSolo, flip } from './resolution'

/**
 * This function is called within this document ONLY. Do not export.
 * The seed should NEVER make its way to frontend.
 * If the round seed ever leaves this file, it should do so HASHED.
 */
function generateRoundSeed(gameName: HouseGameName, roundId: string) {
  const serverSeed = config[gameName].seed
  return saltWithNewSeed(serverSeed, roundId)
}

function determineUserInfo(userId: string, coinflipGame: CoinFlipGame) {
  if (userId === coinflipGame.userIdAuthor) {
    return {
      userId: coinflipGame.userIdAuthor,
      nonce: coinflipGame.authorNonce,
      roundHash: coinflipGame.authorRoundHash,
      roundId: coinflipGame.authorRoundId,
      roundIdForOtherPlayer: coinflipGame.competitorRoundId,
      nonceForOtherPlayer: coinflipGame.competitorNonce,
      betId: coinflipGame.betIdByAuthor,
      guess: coinflipGame.guessAuthor,
      clientSeed: coinflipGame.clientSeed,
      outcome: coinflipGame.outcome,
    }
  } else if (
    coinflipGame.userIdCompetitor &&
    userId === coinflipGame.userIdCompetitor
  ) {
    return {
      userId: coinflipGame.userIdCompetitor,
      nonce: coinflipGame.competitorNonce,
      roundHash: coinflipGame.competitorRoundHash,
      roundId: coinflipGame.competitorRoundId,
      roundIdForOtherPlayer: coinflipGame.authorRoundId,
      nonceForOtherPlayer: coinflipGame.authorNonce,
      betId: coinflipGame.betIdByCompetitor,
      guess: coinflipGame.guessAuthor === 'heads' ? 'tails' : 'heads',
      clientSeed: coinflipGame.clientSeed,
      outcome: coinflipGame.outcome,
    }
  } else {
    return null
  }
}

export async function verifyCoinFlip(
  data: VerifyData<'coinflip'>,
): Promise<VerificationFunctionResult> {
  const activeGames = await getCoinFlipActiveGamesForUser({
    userId: data.user.id,
  })

  /*
   * We want to check if there's an active game BEFORE ending the round. If
   * there is, then we exit the function.
   */
  if (activeGames.length > 0) {
    return VerificationErrorMap.GAME_STILL_ACTIVE
  }

  const coinflipGame = await getCoinFlipGameById(data.betId)

  if (!coinflipGame || ['open', 'started'].includes(coinflipGame.status)) {
    throw new GameVerificationError('coinflip_game_generic_error')
  }

  const requestingUserInfo = determineUserInfo(data.user.id, coinflipGame)

  if (
    !requestingUserInfo ||
    !requestingUserInfo.outcome ||
    !requestingUserInfo.clientSeed
  ) {
    throw new GameVerificationError('coinflip_game_generic_error')
  }

  if (!requestingUserInfo.roundId) {
    throw new GameVerificationError('no__round')
  }

  const coinflipRound = await getCoinFlipRoundById(requestingUserInfo.roundId)
  if (!coinflipRound) {
    throw new GameVerificationError('no__round')
  }

  let seed = coinflipRound.seed
  const hash = coinflipRound.hash
  if (!coinflipRound.roundOver) {
    const endRound = await endCurrentRoundForUser(
      data.user,
      data.gameName,
      CoinFlipRoundModel,
    )
    if (!endRound) {
      throw new GameVerificationError('no__round')
    }

    seed = endRound.hash
  }

  // This should never happen.
  if (!seed) {
    throw new GameVerificationError('no__seed')
  }

  // handle the case where a bot game is verified
  // to be extra cautious, we only use the author's info on the game
  if (
    coinflipGame.userIdCompetitor &&
    coinflipGame.userIdCompetitor === 'bot'
  ) {
    const authorRoundSeed = generateRoundSeed(
      'coinflip',
      coinflipGame.authorRoundId,
    )
    const { gameFinalHash } = createFinalHashSolo(
      requestingUserInfo.clientSeed,
      authorRoundSeed,
      coinflipGame.authorNonce,
    )
    const gameOutcome = flip(gameFinalHash)

    return {
      serverSeed: seed,
      hashedServerSeed: hash,
      nonce: requestingUserInfo.nonce,
      clientSeed: requestingUserInfo.clientSeed,
      blockHeight: coinflipGame.blockHeight,
      result: gameOutcome,
    }
  }

  if (
    !requestingUserInfo.roundIdForOtherPlayer ||
    requestingUserInfo.nonce === undefined ||
    requestingUserInfo.nonceForOtherPlayer === undefined
  ) {
    throw new GameVerificationError('coinflip_missing_competitor')
  }

  const roundSeedForOtherPlayer = generateRoundSeed(
    'coinflip',
    requestingUserInfo.roundIdForOtherPlayer,
  )

  const { gameFinalHash } = createFinalHash(
    requestingUserInfo.clientSeed,
    seed,
    roundSeedForOtherPlayer,
    requestingUserInfo.nonce,
    requestingUserInfo.nonceForOtherPlayer,
  )
  const gameOutcome = flip(gameFinalHash)

  return {
    serverSeed: seed,
    hashedServerSeed: hash,
    nonce: requestingUserInfo.nonce,
    clientSeed: requestingUserInfo.clientSeed,
    result: gameOutcome,
    blockHeight: coinflipGame.blockHeight,

    /**
     * This is the result of salting the other player's seed -- safe to send to FE
     * NEVER send the other player's round seed to FE
     */
    hashForOtherPlayer: createFinalHashSolo(
      requestingUserInfo.clientSeed,
      roundSeedForOtherPlayer,
      requestingUserInfo.nonceForOtherPlayer,
    ),
  }
}
