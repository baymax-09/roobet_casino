import { getActiveBetById, prepareAndCloseoutActiveBet } from 'src/modules/bet'
import { type ActiveBet } from 'src/modules/bet/types'
import { scopedLogger } from 'src/system/logger'
import { MutexLock } from 'src/util/named-lock'
import { isRejected } from 'src/util/promise'
import {
  ActionLockSeconds,
  createGame as dbCreateGame,
  gameExists as dbGameExists,
  startGame as dbStartGame,
  deleteGame,
  getGameById,
  getGamesForPlayer,
  upsertGame,
} from '../documents/blackjackGames'
import { recordHistory } from '../documents/blackjackHistory'
import {
  BLACKJACK_21_PLUS_3_PAYOUT_FLUSH,
  BLACKJACK_21_PLUS_3_PAYOUT_STRAIGHT,
  BLACKJACK_21_PLUS_3_PAYOUT_STRAIGHT_FLUSH,
  BLACKJACK_21_PLUS_3_PAYOUT_SUITED_TRIPLE,
  BLACKJACK_21_PLUS_3_PAYOUT_THREE_OF_A_KIND,
  BLACKJACK_GAME_NAME,
  BLACKJACK_INSURANCE_PAYOUT,
  BLACKJACK_PAYOUT_BLACKJACK_RATE,
  BLACKJACK_PAYOUT_STANDARD_RATE,
  BLACKJACK_PERFECT_PAIR_PAYOUT_COLORED,
  BLACKJACK_PERFECT_PAIR_PAYOUT_MIXED,
  BLACKJACK_PERFECT_PAIR_PAYOUT_TRUE,
  BlackjackAggregateError,
  BlackjackDealerStatusError,
  BlackjackError,
  BlackjackGameNotFoundError,
  BlackjackInvalidCloseoutError,
  BlackjackMutexError,
  BlackjackNoActiveWagerError,
  BlackjackSideBetCalculationError,
  DEALER_HOLE_INDEX,
  DEALER_ID,
  GameStatus,
  HandActionType,
  HandOutcomeType,
  HandStatusDefault,
  HandWagerType,
  MAX_SHOE_SIZE,
  WagerOutcomeType,
  isHandWithStatus,
  isPlayerSeat,
  isPlayerSeatWithLiveHandWagers,
  isUnresolvedSideWager,
  isUserHandMainWagerWithSides,
  type Card,
  type DealerSeat,
  type GameState,
  type Hand,
  type PlayerCard,
  type PlayerHand,
  type PlayerSeat,
  type PlayerSeatRequest,
  type Table,
  type UserHandMainWager,
  type UserHandSideWager,
} from '../types'
import {
  isActiveBetWithWagers,
  type ActiveBetWithWagers,
  type PlayerSeatCloseOut,
} from '../types/bets'
import {
  getDealerHand,
  getTableDealerActive,
  makeAction,
  setGameStatus,
  sortWagersByIndex,
} from '../utils'
import {
  getHandStatus,
  is21Plus3,
  isFlush,
  isPerfectPair,
  isPerfectPairMixed,
  isPrefectPairColored,
  isPrefectPairTrue,
  isStraight,
  isStraightFlush,
  isSuited3OfAKind,
  isThreeOfAKind,
} from './calculator'
import { maybeDealersTurn } from './dealer'
import { getProvableShoe } from './shoe'

const logScope = 'game'

export type LockAction<T> = () => Promise<T>
export type GameAction = (game: GameState) => Promise<GameState>

/**
 * Creates a new game of blackjack.
 * @returns A pending {@link GameState} with an `id`, `seed`, and 1 seat.
 */
export async function createGame(
  seed: string,
  playerId: string,
): Promise<GameState> {
  return await dbCreateGame(seed, { playerId, hands: [] })
}

/**
 * Starts a game of blackjack.
 * @param id The game ID.
 * @param hash The game hash.
 * @param seats The game seats.
 * @returns A game state object required for subsequent actions.
 * @throws A {@link BlackjackError} if the game cannot be started.
 */
export async function startGame(
  id: string,
  hash: string,
  seats: PlayerSeatRequest[],
): Promise<GameState> {
  const canStart = await gameExists(id, GameStatus.Pending)
  if (!canStart) {
    throw BlackjackError.logAndReturn(
      new BlackjackGameNotFoundError(id, logScope),
    )
  }

  const deck = getProvableShoe(hash)
  const dealerIndex = seats.reduce((pre, cur) => {
    return pre + cur.wagers.length * 2
  }, 0)
  const dealerHand = deck.slice(dealerIndex, dealerIndex + 2)
  const players: Table = [
    ...seats.map(seat => {
      return createPlayerSeat(seat, deck, dealerHand)
    }),
    createDealerSeat(deck),
  ]
  const game = await dbStartGame(id, hash, players)
  const startedGame = postActionProcess(game)
  if (startedGame.status === GameStatus.Complete) {
    return await closeoutGame(startedGame)
  }
  return startedGame
}

/**
 * Creates a dealer seat from a request.
 * @param deck The deck from which to deal.
 * @returns A player seat.
 */
function createDealerSeat(deck: Card[]): DealerSeat {
  const hand = dealInitialHand(deck)
  hand.cards[DEALER_HOLE_INDEX].hidden = true
  hand.status = getHandStatus(hand, hand)

  return {
    playerId: DEALER_ID,
    hands: [hand],
  }
}

/**
 * Creates a player seat from a request.
 * @param seat The seat request.
 * @param deck The deck from which to deal.
 * @param dealerCards The dealers cards.
 * @returns A player seat.
 */
function createPlayerSeat(
  seat: PlayerSeatRequest,
  deck: Card[],
  dealerCards: Card[],
): PlayerSeat {
  const dealerHand = {
    handIndex: 0,
    status: HandStatusDefault,
    actions: [],
    cards: dealerCards.map((crd, ndx) => ({
      ...crd,
      hidden: ndx === DEALER_HOLE_INDEX,
    })),
  }
  let nextHandIndex = Math.max(
    0,
    ...seat.wagers.map(wager => wager.handIndex ?? 0),
  )
  const sortedWagers = [...seat.wagers]
    .map(wager => ({
      ...wager,
      handIndex: wager.handIndex ?? nextHandIndex++,
    }))
    .sort(sortWagersByIndex)
  return {
    seatIndex: seat.seatIndex,
    playerId: seat.playerId,
    betId: seat.betId,
    hands: sortedWagers.map(wager => {
      const hand = dealInitialPlayerHand(deck, wager)
      hand.status = getHandStatus(hand, dealerHand)
      return hand
    }),
  }
}

/**
 * Deals a hand of cards from the deck.
 * @param deck The deck from which to deal.
 * @returns A hand of cards.
 */
export function dealInitialHand(deck: Card[]): Hand {
  const index = MAX_SHOE_SIZE - deck.length
  const first = deck.shift()!
  const second = deck.shift()!
  const cards: PlayerCard[] = [
    { ...first, hidden: false },
    { ...second, hidden: false },
  ]
  return {
    cards,
    handIndex: 0,
    status: HandStatusDefault,
    actions: [
      makeAction(HandActionType.Deal, { shoeIndex: index }),
      makeAction(HandActionType.Deal, { shoeIndex: index + 1 }),
    ],
  }
}

/**
 * Deals a hand of cards from the deck.
 * @param deck The deck from which to deal.
 * @param wager The wagers placed on this hand, and the `handIndex`.
 * @returns A hand of cards.
 */
export function dealInitialPlayerHand(
  deck: Card[],
  wager: UserHandMainWager & { handIndex: number },
): PlayerHand {
  return {
    ...dealInitialHand(deck),
    handIndex: wager.handIndex,
    wager: { amount: wager.amount, type: wager.type, sides: wager.sides },
    status: HandStatusDefault,
  }
}

/**
 * Closes out a {@link PlayerSeat}.
 * @param closeout The {@link PlayerSeatCloseOut} to close out.
 */
export async function closeOutSeat(closeout: PlayerSeatCloseOut) {
  const logScope = 'closeOutSeat'
  const {
    gameId,
    dealer,
    player: { betId, playerId, hands },
  } = closeout
  if (!isHandWithStatus(dealer.hands[0])) {
    throw BlackjackError.logAndReturn(
      new BlackjackDealerStatusError(closeout.gameId, logScope),
    )
  }
  const dealerStatus = dealer.hands[0].status
  const payout = hands.reduce((subTotal, hand) => {
    const { cards: handCards, status: handStatus } = hand
    const handOutcome = handStatus.outcome
    const winRate = handStatus.isBlackjack
      ? BLACKJACK_PAYOUT_BLACKJACK_RATE
      : BLACKJACK_PAYOUT_STANDARD_RATE
    let sideValue = 0
    if (isUserHandMainWagerWithSides(hand.wager)) {
      for (const wager of hand.wager.sides) {
        switch (wager.type) {
          case HandWagerType.PerfectPair:
            sideValue += getPerfectPairsPayout(handCards, wager.amount)
            break
          case HandWagerType.TwentyOnePlusThree:
            sideValue += get21Plus3Payout(
              handCards,
              dealer.hands[0],
              wager.amount,
            )
            break
          case HandWagerType.Insurance:
            sideValue +=
              dealerStatus.isBlackjack && !handStatus.isBlackjack
                ? wager.amount * BLACKJACK_INSURANCE_PAYOUT
                : 0
            break
        }
      }
    }

    return (() => {
      if (handOutcome === HandOutcomeType.Win) {
        return (
          subTotal + sideValue + hand.wager.amount + hand.wager.amount * winRate
        )
      } else if (handOutcome === HandOutcomeType.Push) {
        return subTotal + sideValue + hand.wager.amount
      } else if (handOutcome === HandOutcomeType.Loss) {
        return subTotal + sideValue
      } else {
        throw BlackjackError.logAndReturn(
          new BlackjackError(
            'Attempt to Closeout Hand with Unknown Outcome',
            gameId,
            logScope,
            { playerId, betId, dealer, hands },
          ),
        )
      }
    })()
  }, 0)

  // Make sure they have an active bet
  const activeBet = await getActiveBetById(betId)
  if (activeBet && isActiveBetWithWagers(activeBet)) {
    const finalBet = makeFinalActiveBet(activeBet, payout)
    try {
      await prepareAndCloseoutActiveBet(finalBet)
    } catch (err) {
      throw BlackjackError.logAndReturn(err)
    }
  } else {
    throw BlackjackError.logAndReturn(
      new BlackjackNoActiveWagerError(
        gameId,
        playerId,
        0, // Irrelevant in this context
        betId,
        logScope,
      ),
    )
  }
}

/**
 * Makes an {@link ActiveBetWithWagers} into an {@link ActiveBet} with only the required properties.
 * @param activeBet The {@link ActiveBetWithWagers} to make final.
 * @returns The {@link ActiveBet} with only the required properties.
 */
function makeFinalActiveBet(
  activeBet: ActiveBetWithWagers,
  payoutValue: number,
): ActiveBet {
  return {
    payoutValue,
    balanceType: activeBet.balanceType,
    betAmount: activeBet.betAmount,
    closedOut: activeBet.closedOut,
    gameId: activeBet.gameId,
    gameName: activeBet.gameName,
    highroller: activeBet.highroller,
    id: activeBet.id,
    incognito: activeBet.incognito,
    timestamp: activeBet.timestamp,
    userId: activeBet.userId,
  }
}

/**
 * Processes {@link GameState} updates after an turn or action.
 * @param game The {@link GameState} to update.
 * @returns The updated {@link GameState}.
 */
export function postActionProcess(game: GameState): GameState {
  // Decide if it's the dealers turn or not, and maybe take it.
  const postDealerGame = maybeDealersTurn(game)

  // Find the dealer
  const postDealerHand = getDealerHand(postDealerGame)

  // Update the statuses post-action
  game.players.filter(isPlayerSeat).forEach(player => {
    player.hands.forEach(hand => {
      hand.status = getHandStatus(hand, postDealerHand)
    })
  })

  // Process any side bets
  const postSideBetsGame = processSideBets(postDealerGame)

  // Always update the active state of the game, and the dealers hole card visibility.
  const postStatusGame = setGameStatus(postSideBetsGame)
  const statusDealerHand = getDealerHand(postStatusGame)
  statusDealerHand.cards[DEALER_HOLE_INDEX].hidden =
    postStatusGame.status === GameStatus.Active

  return postStatusGame
}

export async function closeoutGame(game: GameState): Promise<GameState> {
  if (game.status !== GameStatus.Complete) {
    throw BlackjackError.logAndReturn(
      new BlackjackInvalidCloseoutError(game.id, logScope),
    )
  }

  const gameId = game.id
  const dealer = getTableDealerActive(game)
  const dealerHand = getDealerHand(game)
  dealerHand.cards[DEALER_HOLE_INDEX].hidden = false
  dealerHand.status = getHandStatus(dealerHand, dealerHand)
  game.players.filter(isPlayerSeatWithLiveHandWagers).forEach(player => {
    player.hands.forEach(hand => {
      hand.status = getHandStatus(hand, dealerHand)
    })
  })
  const handsToClose = game.players
    .filter(isPlayerSeatWithLiveHandWagers)
    .map(player => ({ gameId, player, dealer }))
    .flat()
  const results = await Promise.allSettled(handsToClose.map(closeOutSeat))
  const errors = results.filter(isRejected).map(result => result.reason)
  if (errors.length > 0) {
    BlackjackError.logAndIgnore(
      new BlackjackAggregateError(gameId, logScope, errors),
    )
  }
  return await moveGameToHistory(game)
}

/**
 * Moves a {@link GameState game} to history.
 * @param game The {@link GameState game} to move.
 */
async function moveGameToHistory(game: GameState): Promise<GameState> {
  // Record the game in history
  const histGame = await recordHistory(game)
  if (histGame) {
    // Delete the game
    await deleteGame(game.id)
  }

  return histGame
}

/**
 * Processes side bets for a game.
 * @param game The game to process.
 * @returns The potentially updated game.
 */
export function processSideBets(game: GameState): GameState {
  const dealer = getDealerHand(game)
  for (const player of game.players.filter(isPlayerSeat)) {
    const logger = scopedLogger(BLACKJACK_GAME_NAME)(logScope, {
      userId: player.playerId,
    })
    for (const hand of player.hands) {
      if (isUserHandMainWagerWithSides(hand.wager)) {
        const sides = hand.wager.sides.filter(isUnresolvedSideWager) ?? []
        for (const side of sides) {
          const outcome = getSideBetOutcome(side, hand, dealer, game)
          if (side.outcome !== outcome) {
            const logMeta = {
              playerId: player.playerId,
              gameId: game.id,
              old: { ...side },
              new: { ...side, outcome },
            }
            logger.debug('Changing side bet outcome', logMeta)
            side.outcome = outcome
          }
        }
      }
    }
  }
  return game
}

/**
 * Gets the outcome of a side bet.
 * @param side The {@link UserSideWager} to check.
 * @param hand The {@link Hand} to check.
 * @param dealer The {@link DealerSeat} involved.
 * @returns The outcome of the side bet.
 */
export function getSideBetOutcome(
  side: UserHandSideWager,
  hand: Hand,
  dealer: Hand,
  game: GameState,
): WagerOutcomeType {
  const handStatus = getHandStatus(hand, dealer)
  switch (side.type) {
    case HandWagerType.PerfectPair:
      return getPerfectPairsOutcome(hand.cards)
    case HandWagerType.TwentyOnePlusThree:
      return get21Plus3Outcome(hand.cards, dealer)
    case HandWagerType.Insurance:
      if (!isHandWithStatus(dealer)) {
        throw BlackjackError.logAndReturn(
          new BlackjackDealerStatusError(game.id, logScope),
        )
      }
      return dealer.status.isBlackjack && !handStatus.isBlackjack
        ? WagerOutcomeType.Win
        : WagerOutcomeType.Loss
    default:
      return WagerOutcomeType.Unknown
  }
}

/**
 * Gets the outcome of a perfect pairs wager.
 * @param cards The cards to check.
 * @returns The outcome of the wager.
 * @throws {@link BlackjackValidationError} if there are less than 2 cards.
 */
export function getPerfectPairsOutcome(cards: PlayerCard[]): WagerOutcomeType {
  if (cards.length < 2) {
    throw BlackjackError.logAndReturn(
      new BlackjackSideBetCalculationError(HandWagerType.PerfectPair, logScope),
    )
  }

  const checkCards = cards.slice(0, 2)
  const result = isPerfectPair(checkCards)
  return result ? WagerOutcomeType.Win : WagerOutcomeType.Loss
}

/**
 * Gets the payout of a perfect pairs wager.
 * @param cards The {@link PlayerCard} instances to check.
 * @param wager The wager amount.
 * @returns The payout of the wager, or `0` if it didn't win.
 */
export function getPerfectPairsPayout(
  cards: PlayerCard[],
  wager: number,
): number {
  const checkCards = [...cards.slice(0, 2)]
  const outcome = getPerfectPairsOutcome(checkCards)
  if (outcome === WagerOutcomeType.Win) {
    if (isPrefectPairTrue(checkCards)) {
      // Truly Perfect Pair = 25:1
      return wager * BLACKJACK_PERFECT_PAIR_PAYOUT_TRUE
    }
    if (isPrefectPairColored(checkCards)) {
      // Colored Perfect Pair = 12:1
      return wager * BLACKJACK_PERFECT_PAIR_PAYOUT_COLORED
    }
    if (isPerfectPairMixed(checkCards)) {
      // Mixed Perfect Pair = 6:1
      return wager * BLACKJACK_PERFECT_PAIR_PAYOUT_MIXED
    }
  }
  return 0
}

/**
 * Gets the outcome of a perfect pairs wager.
 * @param cards The {@link PlayerCard} instances to check.
 * @param dealer The {@link DealerSeat} involved.
 * @returns The outcome of the wager.
 * @throws {@link BlackjackValidationError} if there are less than 2 cards.
 */
export function get21Plus3Outcome(
  cards: PlayerCard[],
  dealer: Hand,
): WagerOutcomeType {
  if (cards.length < 2 || dealer.cards.length < 2) {
    throw BlackjackError.logAndReturn(
      new BlackjackSideBetCalculationError(HandWagerType.Insurance, logScope),
    )
  }

  const checkCards = [...cards.slice(0, 2), { ...dealer.cards[0] }]
  const result = is21Plus3(checkCards)
  return result ? WagerOutcomeType.Win : WagerOutcomeType.Loss
}

/**
 * Gets the payout of a 21+3 wager.
 * @param cards The {@link PlayerCard} instances to check.
 * @param dealer The {@link DealerSeat} involved.
 * @param wager The wager amount.
 * @returns The payout of the wager, or `0` if it didn't win.
 * @throws {@link BlackjackValidationError} if there are less than 2 cards.
 */
export function get21Plus3Payout(
  cards: PlayerCard[],
  dealer: Hand,
  wager: number,
): number {
  const outcome = get21Plus3Outcome(cards, dealer)
  if (outcome === WagerOutcomeType.Win) {
    const checkCards = [...cards.slice(0, 2), dealer.cards[0]]
    if (isSuited3OfAKind(checkCards)) {
      // Suited 3 of a Kind = 100:1
      return wager * BLACKJACK_21_PLUS_3_PAYOUT_SUITED_TRIPLE
    }
    if (isStraightFlush(checkCards)) {
      // Straight Flush = 40:1
      return wager * BLACKJACK_21_PLUS_3_PAYOUT_STRAIGHT_FLUSH
    }
    if (isThreeOfAKind(checkCards)) {
      // 3 of a Kind = 30:1
      return wager * BLACKJACK_21_PLUS_3_PAYOUT_THREE_OF_A_KIND
    }
    if (isStraight(checkCards)) {
      // Straight = 10:1
      return wager * BLACKJACK_21_PLUS_3_PAYOUT_STRAIGHT
    }
    if (isFlush(checkCards)) {
      // Flush = 5:1
      return wager * BLACKJACK_21_PLUS_3_PAYOUT_FLUSH
    }
  }
  return 0
}

/**
 * Gets a game by ID.
 * @param gameId The game ID.
 * @returns The game state.
 */
export async function getGame(gameId: string): Promise<GameState> {
  return await getGameById(gameId)
}

/**
 * Gets all games for a player.
 * @param playerId The player ID.
 * @returns An array of {@link GameState} objects, or an empty array if the player has no active games.
 */
export async function getPlayerGames(playerId: string): Promise<GameState[]> {
  return await getGamesForPlayer(playerId)
}

/**
 * Check if a game exists by its ID, and optionally in a particular {@link status}.
 * @param gameId The game ID.
 * @param status The game status to check for, or undefined to not care.
 * @returns `true` if the game exists and is in the {@link status} or the {@link status} is `undefined`,
 * `false` otherwise.
 */
export async function gameExists(
  gameId: string,
  status: GameStatus,
): Promise<boolean> {
  return await dbGameExists(gameId, status)
}

/**
 * Mutates persisted, active {@link GameState} objects.
 * @param gameId The game ID.
 * @param action A function that mutates the game state and returns the mutated version.
 * @returns The mutated game state.
 */
export async function withActiveGame(
  gameId: string,
  action: GameAction,
): Promise<GameState> {
  return await withLockedGame(gameId, async () => {
    try {
      const pre = await getGameById(gameId)
      const post = await action(pre)
      if (post) {
        const played = postActionProcess(post)
        await upsertGame({ ...played, id: gameId })
        if (played.status === GameStatus.Complete) {
          return await closeoutGame(played)
        }
        return played
      }
      return pre
    } catch (error) {
      throw BlackjackError.logAndReturn(error)
    }
  })
}

/**
 * Mutates persisted, active {@link GameState} objects.
 * @param gameId The ID of the game to mutate.
 * @param func A function that mutates the game state and returns the mutated version.
 * @returns The mutated game state.
 */
async function withLockedGame(
  gameId: string,
  func: LockAction<GameState>,
): Promise<GameState> {
  const lock = await MutexLock.acquireLock(
    gameId,
    BLACKJACK_GAME_NAME,
    gameId,
    ActionLockSeconds * 1000,
  )
  if (!lock) {
    throw BlackjackError.logAndReturn(new BlackjackMutexError(gameId, logScope))
  }
  try {
    return await func()
  } finally {
    await lock.release()
  }
}
