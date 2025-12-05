import { v1 as uuidv1 } from 'uuid'
import { type RTable } from 'rethinkdbdash'

import { placeBet, prepareAndCloseoutActiveBet } from 'src/modules/bet'
import {
  clearUserActiveGames,
  getActiveGameById,
  getActiveGameByUser,
  createActiveGame,
  clearActiveGame,
} from 'src/modules/game/documents/active_game'
import { startNewRound } from 'src/modules/game/lib/round'
import { APIValidationError } from 'src/util/errors'
import { type Types as UserTypes } from 'src/modules/user'
import {
  getActiveBetById,
  updateActiveBet,
} from 'src/modules/bet/documents/active_bet'

import { createTower, getCurrentRow } from './gameboard'
import { getPayoutMultiplier } from './payout'
import { insertTowersHistory } from '../documents/towers_history'
import { type ActiveTowersGame } from '../documents/active_towers_games'
import { ActiveTowersGamesModel } from '../documents/active_towers_games'
import { type ActiveGame } from '../../game/types'
import { type Difficulty } from '../'
import { GameName } from '../'
import { towersLogger } from './logger'

function newTowersGame() {
  return {
    id: uuidv1(),
    gameName: GameName,
  }
}

export async function endActiveGame<T extends ActiveGame>(
  activeGameTable: RTable<T, any>,
  activeGame: T,
  payoutMultiplier: number,
) {
  await clearActiveGame(activeGameTable, activeGame.id)

  const bet = await getActiveBetById(activeGame.bet)
  if (!bet) {
    throw new APIValidationError('bet__not_found')
  }
  await updateActiveBet(bet.id, { payoutMultiplier })
  bet.payoutValue = bet.betAmount * payoutMultiplier

  try {
    return await prepareAndCloseoutActiveBet(bet)
  } catch (error) {
    towersLogger('endActiveGame', { userId: activeGame.userId }).error(
      'error closing out bet',
      { bet },
      error,
    )
  }

  return bet
}

async function start(
  user: UserTypes.User,
  betAmount: number,
  difficulty: Difficulty,
  clientSeed: string,
  freeBetItemId: string,
) {
  const activeGame = await getActiveGameByUser<ActiveTowersGame>(
    ActiveTowersGamesModel,
    user.id,
  )
  if (activeGame) {
    await clearUserActiveGames(ActiveTowersGamesModel, user.id)
  }

  // Hash should NEVER be returned.
  const { hash, provablyFairInfo } = await startNewRound(
    user,
    GameName,
    clientSeed,
  )
  const { deck, columns, poopPerRow, rows } = createTower(
    difficulty,
    betAmount,
    hash,
  )

  const extraBetFields = {
    clientSeed,
    roundId: provablyFairInfo.currentRound?.id,
    roundHash: provablyFairInfo.currentRound?.hash,
    nonce: provablyFairInfo.currentRound?.nonce,
  }

  const bet = await placeBet({
    user,
    game: newTowersGame(),
    betAmount,
    extraBetFields,
    freeBetItemId,
  })

  const extraActiveGameParams = {
    bet: bet.id,
    poopPerRow,
    columns,
    rows,
    difficulty,
  }
  const activeGameId = await createActiveGame<ActiveTowersGame>(
    ActiveTowersGamesModel,
    user.id,
    deck,
    extraActiveGameParams,
  )

  return { activeGameId, bet, provablyFairInfo }
}

async function end(activeGameId: string, cashout = false) {
  const activeGame = await getActiveGameById<ActiveTowersGame>(
    ActiveTowersGamesModel,
    activeGameId,
  )
  if (!activeGame) {
    throw new APIValidationError('game__no_active_game')
  }

  const currentRow = getCurrentRow(activeGame)

  if (cashout === true && currentRow === 0) {
    throw new APIValidationError('game__no_tile_selected')
  }

  const payoutMultiplier = cashout
    ? getPayoutMultiplier(
        currentRow - 1,
        activeGame.poopPerRow,
        activeGame.columns,
      )
    : 0
  const bet = await endActiveGame(
    ActiveTowersGamesModel,
    activeGame,
    payoutMultiplier,
  )
  await insertTowersHistory(activeGame)

  return {
    deck: activeGame.deck,
    bet: {
      ...bet,
      closeoutTimestamp: null,
    },
  }
}

export const TowersGame = {
  start,
  end,
}
