import { r } from 'src/system'
import {
  clearUserActiveGames,
  getActiveGameByUser,
} from 'src/modules/game/documents/active_game'
import { APIValidationError } from 'src/util/errors'
import { getActiveBetById } from 'src/modules/bet/documents/active_bet'
import { getCurrentRoundForUser } from 'src/modules/game/lib/provably_fair/userGenerated'
import { type Types as GameTypes } from 'src/modules/game'
import { type Types as UserTypes } from 'src/modules/user'
import { type ActiveBet } from 'src/modules/bet/types'
import { type DBCollectionSchema } from 'src/modules'

import { getCurrentRow } from '../lib/gameboard'
import { type CashDashRound } from './cash_dash_rounds'
import { type Difficulty } from '..'
import { GameName } from '..'
import { CashDashRoundModel } from './cash_dash_rounds'

// TODO make DeckRow keys more explicit such as '0' | '1' | '2'
type DeckRow = Record<string, string>
export type Deck = Record<string, DeckRow>

export interface ActiveCashDashGame extends GameTypes.ActiveGame {
  difficulty: Difficulty
  rows: number
  columns: number
  poopPerRow: number
  deck: Deck
  played: Deck
}

export interface ActiveGameResponse {
  activeGameId: string
  difficulty: string
  currentRow: number
  bet: ActiveBet
  provablyFairInfo: CashDashRound
  playedRows: Deck
}

/**
 * Do not use my exported value outside of this file. Please do not follow this pattern.
 */
export const ActiveCashDashGamesModel = r.table<ActiveCashDashGame>(
  'active_cash_dash_games',
)

export async function getActiveCashDashGameByUser(userId: string) {
  const [activeGame] = await ActiveCashDashGamesModel.getAll(userId, {
    index: 'userId',
  }).run()
  return activeGame
}

export async function getActiveCashDashGame(
  user: UserTypes.User,
): Promise<ActiveGameResponse> {
  const activeGame = await getActiveGameByUser<ActiveCashDashGame>(
    ActiveCashDashGamesModel,
    user.id,
  )
  const currentRound = await getCurrentRoundForUser<CashDashRound>(
    user,
    GameName,
    CashDashRoundModel,
  )
  if (!activeGame?.bet) {
    throw new APIValidationError('game__no_active_game')
  }
  const bet = await getActiveBetById(activeGame.bet)

  if (!currentRound || !bet) {
    await clearUserActiveGames(ActiveCashDashGamesModel, user.id)
    throw 'No Current Round or Active Bet'
  }

  const currentRow = getCurrentRow(activeGame)
  return {
    activeGameId: activeGame.id,
    difficulty: activeGame.difficulty,
    currentRow,
    bet,
    provablyFairInfo: currentRound,
    playedRows: activeGame.played,
  }
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'active_cash_dash_games',
  indices: [{ name: 'userId' }],
}
