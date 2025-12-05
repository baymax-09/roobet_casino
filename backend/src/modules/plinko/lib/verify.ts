import { config } from 'src/system'
import { type VerifyData } from 'src/modules/game/types'
import { endCurrentRoundForUser } from 'src/modules/game/lib/provably_fair/userGenerated'
import { saltWithClientSeed } from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import { buildRandomBools } from 'src/modules/game/lib/shuffle'
import { APIValidationError } from 'src/util/errors'

import { PlinkoRoundModel, getPlinkoRoundById } from '../documents/plinko_round'
import {
  getPlinkoHistoryByBet,
  type PlinkoGame,
} from '../documents/plinko_history'
import { RiskLevels, type RowNumber } from './payout_list'
import {
  calculateBallPath,
  calculateExtraMultiplierFromPath,
  getHoleFromBallPath,
} from './lightning_board'
import { getLightningPayoutsForGameIndex } from './fetch_current_payouts'
import { getPayoutMultiplierForHole } from './board'

export async function plinkoVerify(data: VerifyData<'plinko'>) {
  // Use bet ID to get the board index of this bet
  // Get board for board index
  // Use client hash to generate path
  // Use path to determine result

  const plinkoHistory = await getPlinkoHistoryByBet(data.bet.betId)
  if (!plinkoHistory) {
    throw new APIValidationError('game__too_old_to_verify')
  }

  const round = await getPlinkoRoundById(plinkoHistory.roundId)
  if (!round) {
    throw new APIValidationError('no__round')
  }

  let previousRoundSeed = round.seed
  const previousRoundSeedHash = round.hash
  if (!round.roundOver) {
    const endRound = await endCurrentRoundForUser(
      data.user,
      data.gameName,
      PlinkoRoundModel,
    )
    if (!endRound) {
      throw new APIValidationError('no__round')
    }
    previousRoundSeed = endRound.hash
  }

  // This should never happen.
  if (!previousRoundSeed) {
    throw new APIValidationError('no__seed')
  }
  const finalHash = buildFinalHashForPlinko(previousRoundSeed, plinkoHistory)

  const riskLevelNumber = plinkoHistory?.risk || 0
  const riskLevel = RiskLevels[riskLevelNumber]
  const numberOfRows = (plinkoHistory?.rows ?? 16) as RowNumber
  const gameIndex = plinkoHistory?.boardIndex ?? 0
  // This returns numberOfRows numbers that are either 0 or 1
  const shuffledGroup: number[] = buildRandomBools(numberOfRows, finalHash)
  const path = calculateBallPath(shuffledGroup, numberOfRows)
  const hole = getHoleFromBallPath(path)

  let holeMultiplier = 1
  let cellsMultiplier = 1
  let gameHash
  if (riskLevel === 'lightning') {
    const { payouts, multiplierCells, pregeneratedPlinkoHash } =
      await getLightningPayoutsForGameIndex(gameIndex)
    holeMultiplier = payouts[hole]
    cellsMultiplier = calculateExtraMultiplierFromPath(multiplierCells, path)
    gameHash = pregeneratedPlinkoHash
  } else {
    holeMultiplier = getPayoutMultiplierForHole(hole, riskLevel, numberOfRows)
  }
  let payoutMultiplier =
    holeMultiplier * (cellsMultiplier > 0 ? cellsMultiplier : 1)

  const maxProfit = config.bet.maxProfit
  const wonAmount = payoutMultiplier * data.bet.betAmount
  if (wonAmount > maxProfit) {
    payoutMultiplier = maxProfit / data.bet.betAmount
  }

  return {
    serverSeed: previousRoundSeed,
    hashedServerSeed: previousRoundSeedHash,
    nonce: data.bet.nonce ?? plinkoHistory.nonce, // Legacy bets don't have nonce :(
    clientSeed: data.bet.clientSeed,
    result: payoutMultiplier,
    ...(gameHash && { gameHash }),
  }
}

function buildFinalHashForPlinko(roundSeed: string, game: PlinkoGame) {
  const noncedSeed = `${game.clientSeed} - ${game.nonce}`
  return saltWithClientSeed(roundSeed, noncedSeed)
}
