import { Types } from 'mongoose'
import * as logLib from '../../../system/logger'
import { generateHmac } from '../../game/lib/provably_fair/sharedAlgorithms'
import { getHandStatus } from '../lib/calculator'
import {
  CardSuitType,
  CardValueType,
  DEALER_ID,
  GameStatus,
  HandActionType,
  HandStatusDefault,
  HandWagerType,
  isPlayerSeat,
  type Card,
  type DealerSeat,
  type GameState,
  type HandActionDeal,
  type PlayerCard,
  type PlayerSeat,
  type UserHandMainWager,
  type UserHandWagers,
} from '../types'
import { getRandomSeed } from '../utils'

/**
 * The signature of the {@link getProvableShoe} function.
 */
export type ShoeMockFunc = (seed: string, deckCount?: number) => Card[]

/**
 * Gets a function that can mock the {@link getProvableShoe} function and
 * stack the deck without violating normal constraints.
 * @param stack The stack of cards to deal first, in order.
 * @returns A function that can mock the {@link getProvableShoe} function and stacks your deck.
 */
export function getDeckStacker(stack: Card[]): ShoeMockFunc {
  const { getProvableShoe } = jest.requireActual<{
    getProvableShoe: ShoeMockFunc
  }>('../lib/shoe')
  return (seed: string, deckCount?: number) => {
    const deck = getProvableShoe(seed, deckCount)
    const revStack = [...stack].reverse()
    for (const card of revStack) {
      const lastOne = deck.splice(
        deck.findIndex(
          deckCard =>
            card.suit === deckCard.suit && card.value === deckCard.value,
        )!,
        1,
      )[0]
      deck.unshift(lastOne)
    }
    return deck
  }
}

/**
 * Gets a silent mocked logger for testing logging.
 * @returns A silent mocked logger.
 */
export function getMockedLogger() {
  // Those are probably appropriate thoughts for a different time.
  const flogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    verbose: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn(),
  }
  jest.spyOn(logLib, 'scopedLogger').mockImplementation(_moduleName => {
    return (_scope, _context) => flogger as any
  })

  return flogger
}

/**
 * Builds a basic main wager.
 * @param amount The amount to wager.
 * @returns A {@link UserMainWager} object.
 */
export function buildBasicMainWager(
  amount: number,
  sides: UserHandWagers = [],
): UserHandMainWager {
  return { type: HandWagerType.Main, amount, sides }
}

/**
 * Builds a collection of basic main wagers.
 * @param amounts The amounts to wager.
 * @returns A collection of {@link UserMainWager} objects.
 */
export function buildBasicMainWagers(
  amounts: number[],
  sides: UserHandWagers[] = [],
) {
  return amounts.map((amount, ndx) =>
    buildBasicMainWager(amount, sides.length > ndx ? sides[ndx] : []),
  )
}

/**
 * Builds a basic {@link GameState} object with {@link playerCount} number of player.
 * @param playerCount The number of players to add to the game.
 * @param cards The cards to deal to the players.
 * @returns An object of { game: {@link GameState}, playerId: `string` } object.
 */
export function buildBasicDealtGameWithPlayerId(
  playerCount = 1,
  handCount = 1,
  cards: PlayerCard[] | undefined = undefined,
): {
  game: GameState
  playerId: string
  betId: string
  playerRoundHashes: string[]
} {
  const playerRoundHashes = new Array(playerCount)
    .fill(0)
    .map(() => getRandomSeed())
  const game = buildBasicDealtGame(
    playerCount,
    handCount,
    cards,
    playerRoundHashes,
  )
  const players = game.players.filter(isPlayerSeat)
  const playerId = players[0].playerId
  const betId = players[0].betId!
  return { game, playerId, betId, playerRoundHashes }
}

let dateIncr = 0
/**
 * Gets a timestamp for testing with a forced gap of 500ms between calls.
 * @returns A {@link Date} object.
 */
export function getTimestamp(offsetSecs = 0): Date {
  const ret = new Date(Date.now() + dateIncr + offsetSecs * 1000)
  dateIncr += 500
  return ret
}

/**
 * Gets a random object ID.
 * @returns A random object ID as a `string`.
 */
export function getObjectIdValue() {
  return new Types.ObjectId().toString()
}

/**
 * BUilds a basic {@link GameState} object.
 * @returns A {@link GameState} object.
 */
export function buildBasicDealtGame(
  playerCount = 1,
  handCount = 1,
  cards: PlayerCard[] | undefined = undefined,
  roundHashes: string[] | undefined = undefined,
): GameState {
  const validGameId = getObjectIdValue()
  const validGameSeed = getRandomSeed()
  const playerRoundHashes =
    roundHashes ??
    new Array(playerCount).fill(0).map(() => `${getRandomSeed()} - 0`)
  const validGameHash = playerRoundHashes.reduce(
    (pre, cur) => generateHmac(pre, cur),
    validGameSeed,
  )
  const hands = Array(handCount).fill(0)
  const dealer: DealerSeat = {
    playerId: DEALER_ID,
    hands: [
      {
        handIndex: 0,
        cards: [
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Ace,
            hidden: false,
          },
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Six,
            hidden: true,
          },
        ],
        actions: [
          {
            shoeIndex: playerCount * 2,
            type: HandActionType.Deal,
            timestamp: getTimestamp(),
          },
          {
            shoeIndex: playerCount * 2 + 1,
            type: HandActionType.Deal,
            timestamp: getTimestamp(),
          },
        ],
        status: HandStatusDefault,
      },
    ],
  }
  const players: PlayerSeat[] = Array(playerCount)
    .fill(0)
    .map((_, ndx) => {
      const playerCards = cards ?? [
        {
          suit: CardSuitType.Clubs,
          value: CardValueType.Ace,
          hidden: false,
        },
        {
          suit: CardSuitType.Clubs,
          value: CardValueType.Seven,
          hidden: false,
        },
      ]

      return {
        betId: getObjectIdValue(),
        playerId: getObjectIdValue(),
        hands: hands
          .map((_, hdx) => ({
            handIndex: hdx,
            wager: buildBasicMainWager(100, []),
            cards: playerCards,
            status: HandStatusDefault,
            actions: [
              {
                shoeIndex: ndx * 2 + hdx,
                type: HandActionType.Deal,
                timestamp: getTimestamp(),
              } satisfies HandActionDeal,
              {
                shoeIndex: ndx * 2 + 1 + hdx,
                type: HandActionType.Deal,
                timestamp: getTimestamp(),
              } satisfies HandActionDeal,
            ],
          }))
          .map(hand => {
            hand.status = getHandStatus(hand, dealer.hands[0]!)
            return hand
          }),
      }
    })

  const game: GameState = {
    id: validGameId,
    seed: validGameSeed,
    hash: validGameHash,
    status: GameStatus.Active,
    players: [...players, dealer],
  }

  return game
}
