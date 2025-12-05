import { APIValidationError } from 'src/util/errors'
import {
  getActiveGameById,
  markCardAsPlayed,
} from 'src/modules/game/documents/active_game'
import { getCurrentRoundForUser } from 'src/modules/game/lib/provably_fair/userGenerated'
import { type Types as UserTypes } from 'src/modules/user'

import { getPayoutMultiplier } from './payout'
import { type ActiveCashDashGame } from '../documents/active_cash_dash_games'
import { ActiveCashDashGamesModel } from '../documents/active_cash_dash_games'
import { type CashDashRound } from '../documents/cash_dash_rounds'
import { CashDashRoundModel } from '../documents/cash_dash_rounds'
import { GameName, Constants } from '..'
import { CashDashGame } from './game'
import { getCurrentRow } from './gameboard'
import { cashDashLogger } from '../lib/logger'

export async function selectCard(
  activeGameId: string,
  selectedCard: number,
  user: UserTypes.User,
) {
  const activeGame = await getActiveGameById<ActiveCashDashGame>(
    ActiveCashDashGamesModel,
    activeGameId,
  )
  if (!activeGame) {
    throw new APIValidationError('game__no_active_game')
  }

  if (
    isNaN(selectedCard) ||
    selectedCard < 0 ||
    selectedCard > activeGame.columns - 1
  ) {
    throw new APIValidationError('game__invalid_card_number')
  }

  if (!activeGame || activeGame.id !== activeGameId) {
    throw new APIValidationError('game__invalid_game_id')
  }

  const currentRow = getCurrentRow(activeGame)
  const deckRow = activeGame.deck[currentRow]
  if (!deckRow) {
    throw new APIValidationError('game__invalid_card_number')
  }

  const currentRound = await getCurrentRoundForUser<CashDashRound>(
    user,
    GameName,
    CashDashRoundModel,
  )

  if (!currentRound) {
    throw new APIValidationError('game__no_active_game')
  }

  return await playCard(activeGame, selectedCard, currentRound)
}

export async function playCard(
  activeGame: ActiveCashDashGame,
  selectedCard: number,
  currentRound: CashDashRound,
) {
  const currentRow = getCurrentRow(activeGame)
  const deckRow = activeGame.deck[currentRow]
  const card = deckRow[selectedCard]
  if (!card) {
    throw new APIValidationError('game__invalid_card_number')
  }

  deckRow[selectedCard] = 'played'
  const updatedActiveGame = await markCardAsPlayed(
    ActiveCashDashGamesModel,
    activeGame.id,
    currentRow,
    deckRow,
  )

  if (!updatedActiveGame) {
    throw new APIValidationError('game__invalid_card_number')
  }

  if (card === Constants.poop) {
    return await CashDashGame.end(activeGame.id)
  } else if (card === Constants.fruit) {
    try {
      if (currentRow + 1 >= activeGame.rows) {
        return await CashDashGame.end(activeGame.id, true)
      }

      const payoutMultiplier = getPayoutMultiplier(
        currentRow + 1,
        activeGame.poopPerRow,
        activeGame.columns,
      )
      return { result: card, payoutMultiplier, provablyFairInfo: currentRound }
    } catch (error) {
      cashDashLogger('playCard', { userId: activeGame.userId }).error(
        'error with fruit',
        { activeGame },
        error,
      )
    }
  }
}
