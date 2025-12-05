import { type Types } from 'mongoose'

import { config } from 'src/system'
import { prepareAndCloseoutActiveBet } from 'src/modules/bet/documents/active_bet'
import { getActiveBetById } from 'src/modules/bet'
import { emitSocketEventForGame } from 'src/modules/game'
import { generateRoundHash } from 'src/modules/game/lib/provably_fair/userGenerated'
import {
  type GameResolutionMessage,
  type GameResolutionInterface,
} from 'src/modules/game/types'
import { PolygonInterface } from 'src/modules/crypto/polygon'

import {
  updateCoinFlipGame,
  type CoinFlipGame,
} from '../documents/coinFlipGames'
import {
  deleteActionByGameId,
  getOrCreateAction,
} from '../documents/coinFlipIdempotency'
import { createFinalHash, createFinalHashSolo, flip } from './resolution'
import { ErrorMap } from './errors'
import { coinflipLogger } from './logger'

export type CoinFlipMessageData = CoinFlipGame & {
  _id: Types.ObjectId
  competitorNonce?: number
}

const retryCodes = [ErrorMap.MISSING_BLOCKHASH.code]
const attemptLimit = 30

function buildResponse(
  success: boolean,
  gameInfo: CoinFlipMessageData,
  error?: { code: number; message: string },
) {
  if (success) {
    return {
      success,
      gameInfo,
    }
  } else {
    return {
      success,
      error: error || ErrorMap.UNKNOWN_ERROR,
    }
  }
}

async function lookupBlockHash(blockHeight: number) {
  const logger = coinflipLogger('lookupBlockHash', {
    userId: null,
  })
  try {
    const block = await PolygonInterface.fetchRecordedPolygonBlock(
      blockHeight,
      { fallbackOnAPI: true },
    )
    if (!block) {
      logger.error(`Could not fetch block hash for ${blockHeight}`, {
        blockHeight,
      })
      return null
    }

    return block.hash
  } catch (error) {
    logger.error('Unknown error fetching block hash', {}, error)
    return null
  }
}

function getPayoutMultiplier() {
  const houseEdge = config.coinflip.edge / 100
  const edgeMultiplier = 1 - houseEdge
  const payoutMultiplier = edgeMultiplier * 2
  return payoutMultiplier
}

async function validateGame(
  message: GameResolutionMessage<CoinFlipMessageData>,
) {
  const {
    _id,
    status,
    competitorRoundId,
    betIdByCompetitor,
    userIdCompetitor,
  } = message.gameInfo
  const { attempts = 0 } = message

  if (!_id.toString()) {
    return buildResponse(false, message.gameInfo, ErrorMap.MISSING_ID)
  }

  // Create action document or lookup existing if possible.
  const { action, existed } = await getOrCreateAction({
    gameId: _id.toString(),
    action: 'resolve',
  })

  if (!action) {
    return buildResponse(false, message.gameInfo, ErrorMap.MISSING_ACTION)
  }

  if (existed) {
    return buildResponse(false, message.gameInfo, ErrorMap.DUPLICATE_ACTION)
  }

  if (
    !userIdCompetitor ||
    (userIdCompetitor !== 'bot' && (!betIdByCompetitor || !competitorRoundId))
  ) {
    return buildResponse(false, message.gameInfo, ErrorMap.MISSING_COMPETITOR)
  }

  if (status !== 'started') {
    return buildResponse(false, message.gameInfo, ErrorMap.INVALID_STATE)
  }

  if (attempts > attemptLimit) {
    return buildResponse(
      false,
      { ...message.gameInfo },
      ErrorMap.MISSING_BLOCKHASH_ATTEMPT_LIMIT,
    )
  }

  return buildResponse(true, message.gameInfo)
}

async function calculateGameResult(
  message: GameResolutionMessage<CoinFlipMessageData>,
) {
  const {
    _id,
    authorRoundId,
    authorNonce,
    competitorNonce,
    competitorRoundId,
    userIdCompetitor,
    blockHeight,
  } = message.gameInfo

  const blockHash = await lookupBlockHash(blockHeight)

  if (!blockHash) {
    return buildResponse(
      false,
      { ...message.gameInfo },
      ErrorMap.MISSING_BLOCKHASH,
    )
  }

  const { secretHash: roundSeedAuthor } = generateRoundHash(
    'coinflip',
    authorRoundId,
  )

  // Check if this a bot game
  if (userIdCompetitor && userIdCompetitor === 'bot') {
    const { gameFinalHash } = createFinalHashSolo(
      blockHash,
      roundSeedAuthor,
      authorNonce,
    )
    const gameOutcome = flip(gameFinalHash)

    const updatedGame = await updateCoinFlipGame(_id.toString(), {
      status: 'finished',
      outcome: gameOutcome,
      clientSeed: blockHash,
    })

    if (!updatedGame) {
      return buildResponse(false, message.gameInfo, ErrorMap.INVALID_STATE)
    }

    return buildResponse(true, { ...message.gameInfo, outcome: gameOutcome })
  }

  // if its not a bot game, then there are a couple extra validation checks
  if (!competitorRoundId) {
    return buildResponse(
      false,
      message.gameInfo,
      ErrorMap.MISSING_COMPETITOR_ROUND,
    )
  }

  if (competitorNonce === undefined) {
    return buildResponse(
      false,
      message.gameInfo,
      ErrorMap.MISSING_COMPETITOR_NONCE,
    )
  }

  const { secretHash: roundSeedCompetitor } = generateRoundHash(
    'coinflip',
    competitorRoundId,
  )
  const { gameFinalHash } = createFinalHash(
    blockHash,
    roundSeedAuthor,
    roundSeedCompetitor,
    authorNonce,
    competitorNonce,
  )
  const gameOutcome = flip(gameFinalHash)

  const updatedGame = await updateCoinFlipGame(_id.toString(), {
    status: 'finished',
    outcome: gameOutcome,
    clientSeed: blockHash,
  })

  if (!updatedGame) {
    return buildResponse(false, message.gameInfo, ErrorMap.INVALID_STATE)
  }

  return buildResponse(true, { ...message.gameInfo, outcome: gameOutcome })
}

async function closeoutBet(
  message: GameResolutionMessage<CoinFlipMessageData>,
) {
  const {
    _id,
    amount,
    betIdByAuthor,
    betIdByCompetitor,
    guessAuthor,
    outcome,
    userIdAuthor,
    userIdCompetitor,
  } = message.gameInfo
  const balanceUpdateTimestamp = message.balanceUpdateTimestamp

  if (userIdCompetitor !== 'bot' && !betIdByCompetitor) {
    return buildResponse(
      false,
      message.gameInfo,
      ErrorMap.MISSING_COMPETITOR_CLOSEOUT,
    )
  }

  if (!outcome) {
    return buildResponse(false, message.gameInfo, ErrorMap.MISSING_OUTCOME)
  }

  // pay winner
  const payoutMultiplier = getPayoutMultiplier()
  const winnings = amount * payoutMultiplier
  const winner = guessAuthor === outcome ? userIdAuthor : userIdCompetitor

  try {
    // closeout bet
    if (userIdCompetitor !== 'bot') {
      const competitorBet = await getActiveBetById(betIdByCompetitor)
      if (competitorBet) {
        const competitorBetToClose = {
          ...competitorBet,
          payoutMultiplier: winner === userIdCompetitor ? payoutMultiplier : 0,
          payoutValue: winner === userIdCompetitor ? winnings : 0,
        }
        await prepareAndCloseoutActiveBet(
          competitorBetToClose,
          true,
          balanceUpdateTimestamp,
        )
      }
    }

    const authorBet = await getActiveBetById(betIdByAuthor)
    if (authorBet) {
      const authorBetToClose = {
        ...authorBet,
        payoutMultiplier: winner === userIdAuthor ? payoutMultiplier : 0,
        payoutValue: winner === userIdAuthor ? winnings : 0,
      }

      await prepareAndCloseoutActiveBet(
        authorBetToClose,
        true,
        balanceUpdateTimestamp,
      )
    }
    await emitSocketEventForGame('coinflip', 'resolveCoinFlipGame', {
      gameId: _id.toString(),
      outcome,
      winnings,
      winner,
    })
    return buildResponse(true, message.gameInfo)
  } catch (error) {
    coinflipLogger('closeoutBet', { userId: userIdAuthor }).error(
      'coinflip closeoutBet error',
      {
        userIdAuthor,
        userIdCompetitor,
        betIdByAuthor,
        guessAuthor,
        outcome,
        amount,
        payoutMultiplier,
        winnings,
        winner,
      },
      error,
    )
    return buildResponse(
      false,
      message.gameInfo,
      ErrorMap.UNKNOWN_CLOSEOUT_ERROR,
    )
  }
}

async function onError(
  message: GameResolutionMessage<CoinFlipMessageData>,
  error: { message: string; code?: number },
) {
  const { _id } = message.gameInfo
  await deleteActionByGameId({ gameId: _id.toString(), action: 'resolve' })

  if (error.code && retryCodes.includes(error.code)) {
    await updateCoinFlipGame(_id.toString(), { status: 'started' })
    return true
  }

  // if we don't retry, then cancel the game
  await updateCoinFlipGame(_id.toString(), { status: 'cancelled' })
  return false
}

export const CoinFlipResolutionInterface: GameResolutionInterface<CoinFlipMessageData> =
  {
    validateGame,
    calculateGameResult,
    closeoutBet,
    onError,
  }
