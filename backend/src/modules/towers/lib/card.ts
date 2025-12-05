import { APIValidationError } from 'src/util/errors'
import {
  getActiveGameById,
  markCardAsPlayed,
} from 'src/modules/game/documents/active_game'
import { getCurrentRoundForUser } from 'src/modules/game/lib/provably_fair/userGenerated'
import { type Types as UserTypes } from 'src/modules/user'

import { getPayoutMultiplier } from './payout'
import { type ActiveTowersGame } from '../documents/active_towers_games'
import { ActiveTowersGamesModel } from '../documents/active_towers_games'
import { type TowersRound } from '../documents/towers_rounds'
import { TowersRoundModel } from '../documents/towers_rounds'
import { GameName, Constants } from '../'
import { TowersGame } from './game'
import { getCurrentRow } from './gameboard'
import { towersLogger } from './logger'

export async function selectCard(
  activeGameId: string,
  selectedCard: number,
  user: UserTypes.User,
) {
  const activeGame = await getActiveGameById<ActiveTowersGame>(
    ActiveTowersGamesModel,
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

  const currentRound = await getCurrentRoundForUser<TowersRound>(
    user,
    GameName,
    TowersRoundModel,
  )

  if (!currentRound) {
    throw new APIValidationError('game__no_active_game')
  }

  return await playCard(activeGame, selectedCard, currentRound)
}

export async function playCard(
  activeGame: ActiveTowersGame,
  selectedCard: number,
  currentRound: TowersRound,
) {
  const currentRow = getCurrentRow(activeGame)
  const deckRow = activeGame.deck[currentRow]
  const card = deckRow[selectedCard]
  if (!card) {
    throw new APIValidationError('game__invalid_card_number')
  }

  deckRow[selectedCard] = 'played'
  const updatedActiveGame = await markCardAsPlayed(
    ActiveTowersGamesModel,
    activeGame.id,
    currentRow,
    deckRow,
  )

  if (!updatedActiveGame) {
    throw new APIValidationError('game__invalid_card_number')
  }

  if (card === Constants.poop) {
    return await TowersGame.end(activeGame.id)
  } else if (card === Constants.fruit) {
    try {
      if (currentRow + 1 >= activeGame.rows) {
        return await TowersGame.end(activeGame.id, true)
      }

      const payoutMultiplier = getPayoutMultiplier(
        currentRow + 1,
        activeGame.poopPerRow,
        activeGame.columns,
      )
      return { result: card, payoutMultiplier, provablyFairInfo: currentRound }
    } catch (error) {
      towersLogger('playCard', { userId: activeGame.userId }).error(
        'error with fruit',
        { selectedCard, activeGameId: activeGame.id },
        error,
      )
    }
  }
}
