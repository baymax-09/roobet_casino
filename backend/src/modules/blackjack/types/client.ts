import { getTableDealer } from '../utils'
import { CardSuitType, CardValueType } from './cards'
import { DEALER_HOLE_INDEX } from './constants'
import {
  GameStatus,
  HandOutcomeType,
  isHandWithStatus,
  isPlayerSeat,
  type GameState,
  type Table,
} from './player'

/**
 * The state of a blackjack game, suitable for sending to the client.
 */
export class ClientGameState {
  /**
   * The game ID.
   */
  public readonly id: string

  /**
   * The game status.
   */
  public readonly status: GameStatus

  /**
   * The game players, terminated by the dealer.
   */
  public readonly players: Table

  /**
   * Creates a new client game state.
   * @param game The {@link GameState} to be converted.
   * @returns A new {@link ClientGameState} object representing the transmittable aspects of the {@link game}.
   */
  private constructor(game: GameState) {
    this.id = game.id
    this.status = game.status
    this.players = game.players
  }

  /**
   * Hides player hand outcomes if the game is not complete.
   * @param game The {@link GameState} to be potentially modified.
   */
  private static maybeHidePlayerOutcomes(game: GameState) {
    if (game.status !== GameStatus.Complete) {
      for (const player of game.players.filter(isPlayerSeat)) {
        for (const hand of player.hands.filter(isHandWithStatus)) {
          hand.status.outcome = HandOutcomeType.Unknown
        }
      }
    }
  }

  /**
   * For `Active` games, hides aspects of the dealer's hand that should not be visible to the client.
   */
  private static hideDealerParts(game: GameState) {
    const dealer = getTableDealer(game)
    // Don't use getDealerHand here, as it won't be active yet.
    const dealerHand = dealer.hands[0] ?? { cards: [], status: undefined }
    const hiddenCard = {
      suit: CardSuitType.Hidden,
      value: CardValueType.Hidden,
      hidden: true,
    }
    if (game.status === GameStatus.Pending) {
      dealer.hands = []
    } else if (game.status === GameStatus.Active) {
      dealerHand.cards[DEALER_HOLE_INDEX].hidden = true
      dealerHand.cards = dealerHand.cards.map(card =>
        card.hidden ? hiddenCard : card,
      )
      dealerHand.status = undefined
    }
  }

  /**
   * Creates a new client game state.
   * @param game The {@link GameState} to be converted.
   * @returns A new {@link ClientGameState} object representing the transmittable aspects of the {@link game}.
   */
  public static fromGameState(game: GameState): ClientGameState {
    ClientGameState.hideDealerParts(game)
    ClientGameState.maybeHidePlayerOutcomes(game)
    return new ClientGameState(game)
  }
}
