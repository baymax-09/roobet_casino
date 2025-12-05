import { getActiveBetById, updateActiveBetForUser } from 'src/modules/bet'
import { getUserById } from 'src/modules/user'
import {
  deductFromBalance,
  getSelectedBalanceFromUser,
} from 'src/modules/user/balance'
import { r } from 'src/system'
import {
  BLACKJACK_GAME_NAME,
  BlackjackActiveWagerUpdateError,
  BlackjackDoubleDownWagerError,
  BlackjackError,
  BlackjackInsufficientFundsError,
  BlackjackNoActiveWagerError,
  BlackjackPlayerNotFoundError,
  HandActionType,
  isPlayerSeatWithLiveHandWagers,
  type GameState,
  type PlayerHand,
  type PlayerSeatWithLiveWager,
} from '../../types'
import { isActiveBetWithWagers } from '../../types/bets'
import {
  getDealerHand,
  getPlayerByIdOrThrow,
  getPlayerHandByIndex,
  getRemainingShoeAndNextIndex,
  makeAction,
  validatePlayerHandAction,
} from '../../utils'
import { getHandStatus } from '../calculator'
import { withActiveGame } from '../game'

export async function doubleDown(
  gameId: string,
  playerId: string,
  handIndex: number,
): Promise<GameState> {
  return await withActiveGame(gameId, async (game: GameState) => {
    const player = validatePlayerHandAction(
      game,
      playerId,
      handIndex,
      HandActionType.DoubleDown,
    )
    const dealerHand = getDealerHand(game)
    const { realIndex } = getPlayerHandByIndex(game, playerId, handIndex)
    player.hands[realIndex] = await coreDoubleDown(game, playerId, handIndex)
    player.hands[realIndex].status = getHandStatus(
      player.hands[realIndex],
      dealerHand,
    )
    return game
  })
}

/**
 * Performs the core `double-down` logic.
 * @param game The {@link GameState} to use.
 * @param playerId The player ID.
 * @returns The updated {@link Hand}.
 */
export async function coreDoubleDown(
  game: GameState,
  playerId: string,
  handIndex: number,
): Promise<PlayerHand> {
  const player = getPlayerByIdOrThrow(game, playerId)

  // If this is a `live` (i.e. NOT `demo`) bet then we need to update the bet.
  if (isPlayerSeatWithLiveHandWagers(player)) {
    await mutateBetWithDoubleWager(game, player, handIndex)
  }

  const { hand } = getPlayerHandByIndex(game, playerId, handIndex)
  const { remainingShoe, nextIndex } = getRemainingShoeAndNextIndex(game)
  hand.cards.push({ ...remainingShoe[0], hidden: false })
  hand.actions.push(
    makeAction(HandActionType.DoubleDown, { shoeIndex: nextIndex }),
  )
  hand.actions.push(makeAction(HandActionType.Stand, {}))
  hand.status.wasDoubled = true
  hand.status = getHandStatus(hand, getDealerHand(game))

  return hand
}

/**
 * Mutates the active bet to include the double-down wager.
 * @param game The {@link GameState} to use.
 * @param playerId The player ID.
 * @param handIndex The hand index.
 * @param betId The bet ID.
 */
async function mutateBetWithDoubleWager(
  game: GameState,
  player: PlayerSeatWithLiveWager,
  handIndex: number,
) {
  const logScope = 'mutateBetWithDoubleWager'
  const { playerId, betId } = player
  const { hand, realIndex } = getPlayerHandByIndex(game, playerId, handIndex)

  // Make sure we can get the user
  const user = await getUserById(playerId)
  if (!user) {
    throw BlackjackError.logAndReturn(
      new BlackjackPlayerNotFoundError(game.id, logScope, playerId),
    )
  }

  // Make sure they have enough funds
  const doubleDownAmount = hand.wager.amount
  const { balance, balanceType } = await getSelectedBalanceFromUser({ user })
  if (balance < doubleDownAmount) {
    throw BlackjackError.logAndReturn(
      new BlackjackInsufficientFundsError(
        game.id,
        playerId,
        handIndex,
        betId,
        logScope,
      ),
    )
  }

  // Make sure they have an active bet
  const activeBet = await getActiveBetById(betId)
  if (activeBet && isActiveBetWithWagers(activeBet)) {
    // Deduct the balance
    const deduction = await deductFromBalance({
      user,
      amount: doubleDownAmount,
      transactionType: 'bet',
      balanceTypeOverride: balanceType,
      meta: {
        betId,
        provider: 'roobet',
        gameIdentifiers: { gameName: BLACKJACK_GAME_NAME },
      },
    })
    if (deduction.balance >= balance) {
      throw BlackjackError.logAndReturn(
        new BlackjackDoubleDownWagerError(
          game.id,
          playerId,
          handIndex,
          betId,
          logScope,
        ),
      )
    }

    // Update the amount
    const finalAmount = (activeBet.handWagers[realIndex].amount +=
      doubleDownAmount)
    const activeChanges = {
      betAmount: r.row('betAmount').add(doubleDownAmount),
      handWagers: r
        .row('handWagers')
        .merge({ [realIndex]: { amount: finalAmount } }),
    }

    // Save the updated bet
    const result = await updateActiveBetForUser(playerId, betId, activeChanges)
    if (result.errors > 0) {
      throw BlackjackError.logAndReturn(
        new BlackjackActiveWagerUpdateError(
          game.id,
          playerId,
          handIndex,
          betId,
          logScope,
        ),
      )
    }
  } else {
    throw BlackjackError.logAndReturn(
      new BlackjackNoActiveWagerError(
        game.id,
        playerId,
        handIndex,
        betId,
        logScope,
      ),
    )
  }
}
