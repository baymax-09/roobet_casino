import { prepareAndCloseoutActiveBet, placeBet } from 'src/modules/bet'
import { type GameRoundHash } from 'src/modules/game/lib/provably_fair/userGenerated'
import { startNewRound } from 'src/modules/game/lib/round'
import { buildRandomBools } from 'src/modules/game/lib/shuffle'
import { type GameRound } from 'src/modules/game/types/GameRound'
import { type Types as UserTypes } from 'src/modules/user'
import { config } from 'src/system'

import { GameName } from '..'
import { insertPlinkoHistory } from '../documents/plinko_history'

import { getPayoutMultiplierForHole } from './board'
import { getCurrentLightningPayouts } from './fetch_current_payouts'
import { newPlinkoGame } from './game'
import {
  calculateBallPath,
  calculateExtraMultiplierFromPath,
  getHoleFromBallPath,
  LIGHTNING_BOARD_ROW_NUMBERS,
} from './lightning_board'
import { type RiskLevel, type RowNumber } from './payout_list'
import { getNumberOfRiskLevels } from './payout_list'
import { type PathCell } from './lightning_board'
import { type BetHistory } from 'src/modules/bet/types'
import { plinkoLogger } from './logger'

export interface RollResultResponse {
  holeID: string
  bet: BetHistory
  path: PathCell[]
  provablyFairInfo: {
    newRound: boolean
    currentRound: GameRound
    roundStartInfo: GameRoundHash | null
    clientSeed: string
  }
  boardIndex: number
}

// payout in [2, 9]
export async function plinkoRoll(
  user: UserTypes.User,
  clientSeed: string,
  betAmount: number,
  numberOfRows: RowNumber,
  riskLevel: RiskLevel,
  autoBet: boolean,
  balanceUpdateTimestamp: Date,
): Promise<RollResultResponse> {
  const { hash, provablyFairInfo } = await startNewRound(
    user,
    GameName,
    clientSeed,
  )

  let numberOfRows_revalidated = numberOfRows
  if (riskLevel === 'lightning') {
    numberOfRows_revalidated = LIGHTNING_BOARD_ROW_NUMBERS
  }
  // / This returns numberOfRows numbers that are either 0 or 1
  const shuffledGroup: number[] = buildRandomBools(numberOfRows, hash)

  const path = calculateBallPath(shuffledGroup, numberOfRows_revalidated)
  const hole = getHoleFromBallPath(path)

  let holeMultiplier = 1
  let cellsMultiplier = 1
  let boardIndex = 0
  if (riskLevel === 'lightning') {
    const { payouts, gameIndex, multiplierCells } =
      await getCurrentLightningPayouts()
    holeMultiplier = payouts[hole]
    boardIndex = gameIndex
    cellsMultiplier = calculateExtraMultiplierFromPath(multiplierCells, path)
  } else {
    holeMultiplier = getPayoutMultiplierForHole(
      hole,
      riskLevel,
      numberOfRows_revalidated,
    )
  }
  let payoutMultiplier =
    holeMultiplier * (cellsMultiplier > 0 ? cellsMultiplier : 1)

  const maxProfit = config.bet.maxProfit
  const wonAmount = payoutMultiplier * betAmount
  if (wonAmount > maxProfit) {
    payoutMultiplier = maxProfit / betAmount
    plinkoLogger('plinkoRoll', { userId: user.id }).info(
      'bet exceeds max profit',
      {
        wonAmount,
        maxProfit,
        hash,
      },
    )
  }

  const round_id: string = provablyFairInfo.currentRound?.id ?? ''
  const round_hash: string = provablyFairInfo.currentRound?.hash ?? ''
  const round_nonce: number = provablyFairInfo.currentRound?.nonce ?? 0

  const extraBetFields = {
    payoutMultiplier,
    nonce: round_nonce,
    roundId: round_id,
    roundHash: round_hash,
  }

  const riskAsNumber = getNumberOfRiskLevels(riskLevel)

  const activeBet = await placeBet({
    user,
    game: newPlinkoGame(user.id),
    betAmount,
    extraBetFields,
  })

  activeBet.payoutValue = payoutMultiplier * betAmount

  const betHistory = await prepareAndCloseoutActiveBet(
    activeBet,
    true,
    balanceUpdateTimestamp,
  )

  await insertPlinkoHistory({
    betId: activeBet.id,
    userId: user.id,
    risk: riskAsNumber,
    rows: numberOfRows,
    payoutMultiplier,
    boardIndex,
    hole,
    clientSeed,
    roundId: round_id,
    roundHash: round_hash,
    nonce: round_nonce,
    autoBet,
  })

  const holeID = hole.toString()

  return {
    holeID,
    bet: betHistory,
    path,
    provablyFairInfo,
    boardIndex,
  }
}
