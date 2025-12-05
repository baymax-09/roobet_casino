import { HandActionType, type GameState, type Hand } from '../../types'
import {
  getDealerHand,
  getPlayerHandByIndex,
  makeAction,
  validatePlayerHandAction,
} from '../../utils'
import { getHandStatus } from '../calculator'
import { withActiveGame } from '../game'

export async function stand(
  gameId: string,
  playerId: string,
  handIndex: number,
): Promise<GameState> {
  return await withActiveGame(gameId, async (game: GameState) => {
    const player = validatePlayerHandAction(
      game,
      playerId,
      handIndex,
      HandActionType.Stand,
    )
    const dealerHand = getDealerHand(game)
    const { hand, realIndex } = getPlayerHandByIndex(game, playerId, handIndex)
    player.hands[realIndex] = coreStand(hand)
    player.hands[realIndex].status = getHandStatus(
      player.hands[realIndex],
      dealerHand,
    )
    return game
  })
}

/**
 * Performs the core `stand` logic.
 * @param game The {@link GameState} to use.
 * @param hand The {@link Hand} to update.
 * @returns The updated {@link Hand}.
 */
export function coreStand<T extends Hand>(hand: T): T {
  hand.actions.push(makeAction(HandActionType.Stand, {}))
  return hand
}
