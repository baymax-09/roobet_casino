import { v4 as uuidv4 } from 'uuid'

import { placeBet } from 'src/modules/bet'
import { checkSystemEnabled } from 'src/modules/userSettings'
import { type Types as UserTypes } from 'src/modules/user'
import { startNewRound } from 'src/modules/game/lib/round'
import { APIValidationError } from 'src/util/errors'
import { publishGameResolutionEvent } from 'src/modules/game/rabbitmq'
import { PolygonInterface } from 'src/modules/crypto/polygon'

import {
  type CoinFlipGame,
  type CoinFlipOutcome,
  insertCoinFlipGame,
  findCoinFlipGameById,
  joinCoinFlipGame,
  addBotToCoinFlipGame,
} from '../documents/coinFlipGames'
import { coinflipLogger } from './logger'

// in seconds
const cacheExpiration = 2
// 1 block added to the chain per 2 seconds
// add 1 to ensure we don't ever conflict with cache
const blocksToSkip = cacheExpiration / 2 + 1

export async function openCoinFlipGame(
  userAuthor: UserTypes.User,
  guess: CoinFlipOutcome,
  betAmount: number,
): Promise<CoinFlipGame | null> {
  const isEnabled = await checkSystemEnabled(userAuthor, 'coinflip')

  if (!isEnabled) {
    throw new APIValidationError('action__disabled')
  }

  let blockHeight
  try {
    blockHeight =
      await PolygonInterface.fetchLatestPolygonBlock(cacheExpiration)
  } catch (error) {
    coinflipLogger('openCoinFlipGame', { userId: userAuthor.id }).error(
      'No block record found',
    )
    throw new APIValidationError('coinflip__clientSeed')
  }

  // Hash should NEVER be returned.
  const { provablyFairInfo } = await startNewRound(userAuthor, 'coinflip')
  const roundId = provablyFairInfo.currentRound._id.toString()
  const roundHash = provablyFairInfo.currentRound.hash
  const nonce = provablyFairInfo.currentRound.nonce
  const extraBetParams = {
    roundId,
    roundHash,
    nonce: provablyFairInfo.currentRound.nonce,
  }

  const bet = await placeBet({
    user: userAuthor,
    game: { id: uuidv4(), gameName: 'coinflip' },
    betAmount,
    extraBetFields: extraBetParams,
    balanceTypeOverride: null,
  })

  if (provablyFairInfo.currentRound.id === undefined) {
    throw new APIValidationError('round_id__undefined')
  }

  const coinflipGame = await insertCoinFlipGame({
    userIdAuthor: userAuthor.id,
    usernameAuthor: userAuthor.name,
    status: 'open',
    amount: betAmount,
    betIdByAuthor: bet.id,
    blockHeight: blockHeight + blocksToSkip,
    guessAuthor: guess,
    authorRoundId: roundId,
    authorRoundHash: roundHash,
    authorNonce: nonce,
    isAuthorSponsor: !!userAuthor.isSponsor,
  })

  return coinflipGame
}

export async function summonBot(
  userId: string,
  gameId: string,
  balanceUpdateTimestamp: Date,
) {
  const coinflipGame = await addBotToCoinFlipGame({ userId, gameId })

  if (coinflipGame) {
    publishGameResolutionEvent({
      gameName: 'coinflip',
      gameInfo: coinflipGame,
      balanceUpdateTimestamp,
    })
  }

  return {
    success: !!coinflipGame,
    coinflipGame,
  }
}

export async function joinOpenCoinFlipGame(
  userCompetitor: UserTypes.User,
  gameId: string,
  balanceUpdateTimestamp: Date,
): Promise<CoinFlipGame | null> {
  const isEnabled = await checkSystemEnabled(userCompetitor, 'coinflip')

  if (!isEnabled) {
    throw new APIValidationError('action__disabled')
  }

  const gameData = await findCoinFlipGameById(gameId)

  if (!gameData) {
    throw new APIValidationError('game__not_found')
  }

  if (gameData.status !== 'open') {
    throw new APIValidationError('game__not_open')
  }

  const betAmount = gameData.amount

  // Hash should NEVER be returned.
  const { provablyFairInfo } = await startNewRound(userCompetitor, 'coinflip')
  const roundId = provablyFairInfo.currentRound._id.toString()
  const roundHash = provablyFairInfo.currentRound.hash

  const extraBetParams = {
    roundId,
    roundHash,
    nonce: provablyFairInfo.currentRound.nonce,
  }

  const bet = await placeBet({
    user: userCompetitor,
    game: { id: uuidv4(), gameName: 'coinflip' },
    betAmount,
    extraBetFields: extraBetParams,
    balanceTypeOverride: null,
  })

  if (provablyFairInfo.currentRound.id === undefined) {
    throw new APIValidationError('round_id__undefined')
  }

  const coinflipGame = await joinCoinFlipGame({
    userId: userCompetitor.id,
    username: userCompetitor.name,
    gameId,
    betId: bet.id,
    roundId,
    roundHash,
    competitorNonce: provablyFairInfo.currentRound.nonce,
  })

  if (coinflipGame) {
    publishGameResolutionEvent({
      gameName: 'coinflip',
      gameInfo: coinflipGame,
      balanceUpdateTimestamp,
    })
  }

  return coinflipGame
}
