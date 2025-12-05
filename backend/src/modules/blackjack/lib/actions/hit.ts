import { HandActionType, type GameState, type Hand } from '../../types'
import {
  getDealerHand,
  getPlayerHandByIndex,
  getRemainingShoeAndNextIndex,
  makeAction,
  validatePlayerHandAction,
} from '../../utils'
import { getHandStatus } from '../calculator'
import { withActiveGame } from '../game'

export async function hit(
  gameId: string,
  playerId: string,
  handIndex: number,
): Promise<GameState> {
  return await withActiveGame(gameId, async (game: GameState) => {
    const player = validatePlayerHandAction(
      game,
      playerId,
      handIndex,
      HandActionType.Hit,
    )
    const dealerHand = getDealerHand(game)
    const { hand, realIndex } = getPlayerHandByIndex(game, playerId, handIndex)
    player.hands[realIndex] = coreHit(game, hand)
    player.hands[realIndex].status = getHandStatus(
      player.hands[realIndex],
      dealerHand,
    )
    return game
  })
}

/**
 * Performs the core `hit` logic.
 * @param game The {@link GameState} to use.
 * @param hand The {@link Hand} to update.
 * @returns The updated {@link Hand}.
 */
export function coreHit<T extends Hand>(game: GameState, hand: T): T {
  const { remainingShoe, nextIndex } = getRemainingShoeAndNextIndex(game)
  hand.cards.push({ ...remainingShoe[0], hidden: false })
  hand.actions.push(makeAction(HandActionType.Hit, { shoeIndex: nextIndex }))
  return hand
}
