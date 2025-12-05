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
  BlackjackError,
  BlackjackInsufficientFundsError,
  BlackjackNoActiveWagerError,
  BlackjackPlayerNotFoundError,
  BlackjackSplitWagerError,
  HandActionType,
  HandStatusDefault,
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
  insertItemAt,
  makeAction,
  sortHandsByIndex,
  validatePlayerHandAction,
} from '../../utils'
import { getHandStatus } from '../calculator'
import { withActiveGame } from '../game'

export async function split(
  gameId: string,
  playerId: string,
  handIndex: number,
): Promise<GameState> {
  return await withActiveGame(gameId, async (game: GameState) => {
    const player = validatePlayerHandAction(
      game,
      playerId,
      handIndex,
      HandActionType.Split,
    )

    // Split the hand and double the wager
    const { realIndex } = getPlayerHandByIndex(game, playerId, handIndex)
    const [firstHand, secondHand] = await coreSplit(game, playerId, handIndex)

    const dealerHand = getDealerHand(game)
    firstHand.status = getHandStatus(firstHand, dealerHand)
    secondHand.status = getHandStatus(secondHand, dealerHand)

    // Update the player hands
    player.hands[realIndex] = firstHand
    player.hands = insertItemAt(player.hands, secondHand, realIndex + 1)
    player.hands.forEach((hand, index) => {
      hand.handIndex = index
    })
    player.hands = player.hands.sort(sortHandsByIndex)

    return game
  })
}

/**
 * Performs the core `double-down` logic.
 * @param game The {@link GameState} to use.
 * @param playerId The player ID.
 * @returns The updated {@link Hand}.
 */
export async function coreSplit(
  game: GameState,
  playerId: string,
  handIndex: number,
): Promise<[PlayerHand, PlayerHand]> {
  const player = getPlayerByIdOrThrow(game, playerId)
  const dealer = getDealerHand(game)

  // If this is a `live` (i.e. NOT `demo`) bet then we need to update the bet.
  if (isPlayerSeatWithLiveHandWagers(player)) {
    await mutateBetWithSplitWager(game, player, handIndex)
  }

  // Get the remaining shoe and split the hand
  const { remainingShoe, nextIndex } = getRemainingShoeAndNextIndex(game)
  const { hand } = getPlayerHandByIndex(game, playerId, handIndex)
  const [first, second] = splitHand(hand)

  // Add the cards and actions to first
  first.cards.push({ ...remainingShoe[0], hidden: false })
  first.actions.push(
    makeAction(HandActionType.Split, {
      splitFrom: first.handIndex,
      splitTo: second.handIndex,
    }),
  )
  first.actions.push(makeAction(HandActionType.Deal, { shoeIndex: nextIndex }))
  first.status = getHandStatus(first, dealer)

  // Add the cards and actions to second
  second.cards.push({ ...remainingShoe[1], hidden: false })
  second.actions.push(
    makeAction(HandActionType.Deal, { shoeIndex: nextIndex + 1 }),
    makeAction(HandActionType.Split, {
      splitFrom: first.handIndex,
      splitTo: second.handIndex,
    }),
  )
  second.status = getHandStatus(second, dealer)

  // Return the two hands
  return [first, second]
}

/**
 * Splits the hand into two hands.
 * @param hand The {@link Hand} to split.
 * @returns The two {@link Hand}s.
 */
function splitHand(hand: PlayerHand): [PlayerHand, PlayerHand] {
  return [
    {
      handIndex: hand.handIndex,
      wager: hand.wager,
      cards: [{ ...hand.cards[0] }],
      actions: [{ ...hand.actions[0] }],
      status: HandStatusDefault,
    },
    {
      handIndex: hand.handIndex + 1,
      wager: { ...hand.wager, sides: undefined },
      cards: [{ ...hand.cards[1] }],
      actions: [{ ...hand.actions[1] }],
      status: { ...HandStatusDefault, splitFrom: hand.handIndex },
    },
  ]
}

/**
 * Mutates the active bet to include the double-down wager.
 * @param game The {@link GameState} to use.
 * @param playerId The player ID.
 * @param handIndex The hand index.
 * @param betId The bet ID.
 */
async function mutateBetWithSplitWager(
  game: GameState,
  player: PlayerSeatWithLiveWager,
  handIndex: number,
) {
  const logScope = 'mutateBetWithSplitWager'
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
  const splitAmount = hand.wager.amount
  const { balance, balanceType } = await getSelectedBalanceFromUser({ user })
  if (balance < splitAmount) {
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
      amount: splitAmount,
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
        new BlackjackSplitWagerError(
          game.id,
          playerId,
          handIndex,
          betId,
          logScope,
        ),
      )
    }

    // Find the hand index
    const lastHandIndex = Object.entries(activeBet.handWagers).reduce(
      (pre, cur) => Math.max(pre, parseInt(cur[0])),
      0,
    )

    // Update the amount
    const handWagers = {
      ...activeBet.handWagers,
      [lastHandIndex + 1]: {
        ...activeBet.handWagers[realIndex],
        sides: undefined,
        amount: splitAmount,
      },
    }
    const activeChanges = {
      handWagers,
      betAmount: r.row('betAmount').add(splitAmount),
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
