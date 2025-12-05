import { HandActionType, type GameState } from '../types'
import { getTableDealerActive, isDealersTurn } from '../utils'
import { coreHit, coreStand } from './actions'
import { getHandStatus, getHandValue } from './calculator'

export const DEALER_HIT_DECISION_VALUE = 17

/**
 * Determines if it's the dealers turn or not, and if it is, takes the dealers turn.
 * @param game The game state.
 * @returns The game state.
 */
export function maybeDealersTurn(game: GameState): GameState {
  if (!isDealersTurn(game.players)) {
    return game
  }

  // If the dealer's hand value is less than 17, hit. Otherwise, stand.
  const dealer = getTableDealerActive(game)
  const dealerHandValue = getHandValue(dealer.hands[0].cards)
  const dealerLastAction =
    dealer.hands[0].actions[dealer.hands[0].actions.length - 1]
  if (dealerHandValue < DEALER_HIT_DECISION_VALUE) {
    // Dealer hits, if all players are standing, hit until 17 or greater
    let newDealerHandValue = dealerHandValue
    do {
      dealer.hands[0] = coreHit(game, dealer.hands[0])
      dealer.hands[0].status = getHandStatus(dealer.hands[0], dealer.hands[0])
      newDealerHandValue = dealer.hands[0].status.value
    } while (newDealerHandValue <= DEALER_HIT_DECISION_VALUE)
  } else if (
    dealerHandValue >= DEALER_HIT_DECISION_VALUE &&
    dealerLastAction.type !== HandActionType.Stand
  ) {
    // Dealer stands
    dealer.hands[0] = coreStand(dealer.hands[0])
  }

  dealer.hands[0].status = getHandStatus(dealer.hands[0], dealer.hands[0])
  return game
}
