import { generateHmac } from '../../../modules/game/lib/provably_fair/sharedAlgorithms'
import { buildBasicMainWager, getMockedLogger, getTimestamp } from '../test'
import '../test/extensions'
import {
  CardSuitType,
  CardValueType,
  DEALER_ID,
  GameStatus,
  HandActionType,
  HandStatusDefault,
  type GameState,
} from '../types'
import { getDealerHand, getRandomSeed } from '../utils'
import { getHandStatus } from './calculator'
import { maybeDealersTurn } from './dealer'

describe('Dealer', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validSeed = getRandomSeed()
  const validHash = generateHmac(validSeed, validSeed)
  const gameId = '42321323-116b-4754-9e9d-2e2a5a380c79'
  const cases = [
    {
      name: 'Takes Dealers Turn As Expected',
      inputs: {
        playerId: '1',
        handIndex: 0,
        game: {
          id: gameId,
          seed: validSeed,
          hash: validHash,
          status: GameStatus.Active,
          players: [
            {
              playerId: '1',
              hands: [
                {
                  handIndex: 0,
                  status: HandStatusDefault,
                  wager: buildBasicMainWager(0),
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: true,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Two,
                      hidden: false,
                    },
                  ],
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 1,
                    },
                    {
                      type: HandActionType.Hit,
                      timestamp: getTimestamp(2),
                      shoeIndex: 4,
                    },
                  ],
                },
              ],
            },
            {
              playerId: DEALER_ID,
              hands: [
                {
                  handIndex: 0,
                  status: HandStatusDefault,
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: true,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: false,
                    },
                  ],
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 3,
                    },
                  ],
                },
              ],
            },
          ],
        } satisfies GameState,
      },
      expects: {
        throws: false,
        cardCount: 2,
        actionCount: 2,
        lastActionType: HandActionType.Deal,
        calls: {
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Returns Early When Not Dealers Turn (Players)',
      inputs: {
        playerId: '1',
        handIndex: 0,
        game: {
          id: gameId,
          seed: validSeed,
          hash: validHash,
          status: GameStatus.Active,
          players: [
            {
              playerId: '1',
              hands: [
                {
                  handIndex: 0,
                  status: HandStatusDefault,
                  wager: buildBasicMainWager(0),
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: true,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: false,
                    },
                  ],
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 1,
                    },
                  ],
                },
              ],
            },
            {
              playerId: '2',
              hands: [
                {
                  handIndex: 0,
                  status: HandStatusDefault,
                  wager: buildBasicMainWager(0),
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: true,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: false,
                    },
                  ],
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 1,
                    },
                  ],
                },
              ],
            },
            {
              playerId: DEALER_ID,
              hands: [
                {
                  handIndex: 0,
                  status: HandStatusDefault,
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: true,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: false,
                    },
                  ],
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 3,
                    },
                  ],
                },
              ],
            },
          ],
        } satisfies GameState,
      },
      expects: {
        throws: false,
        cardCount: 2,
        actionCount: 2,
        lastActionType: HandActionType.Deal,
        calls: {
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Returns Early When Not Dealers Turn (Hands)',
      inputs: {
        playerId: '1',
        handIndex: 0,
        game: {
          id: gameId,
          seed: validSeed,
          hash: validHash,
          status: GameStatus.Active,
          players: [
            {
              playerId: '1',
              hands: [
                {
                  handIndex: 0,
                  status: HandStatusDefault,
                  wager: buildBasicMainWager(0),
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: true,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: false,
                    },
                  ],
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 1,
                    },
                  ],
                },
                {
                  handIndex: 0,
                  status: HandStatusDefault,
                  wager: buildBasicMainWager(0),
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: true,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: false,
                    },
                  ],
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 1,
                    },
                  ],
                },
              ],
            },
            {
              playerId: DEALER_ID,
              hands: [
                {
                  handIndex: 0,
                  status: HandStatusDefault,
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: true,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: false,
                    },
                  ],
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 3,
                    },
                  ],
                },
              ],
            },
          ],
        } satisfies GameState,
      },
      expects: {
        throws: false,
        cardCount: 2,
        actionCount: 2,
        lastActionType: HandActionType.Deal,
        calls: {
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Dealer Stands With 17',
      inputs: {
        playerId: '1',
        handIndex: 0,
        game: {
          id: gameId,
          seed: validSeed,
          hash: validHash,
          status: GameStatus.Active,
          players: [
            {
              playerId: '1',
              hands: [
                {
                  handIndex: 0,
                  status: HandStatusDefault,
                  wager: buildBasicMainWager(0),
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: true,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: false,
                    },
                  ],
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 1,
                    },
                    { type: HandActionType.Stand, timestamp: getTimestamp(2) },
                  ],
                },
              ],
            },
            {
              playerId: DEALER_ID,
              hands: [
                {
                  handIndex: 0,
                  status: HandStatusDefault,
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: true,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Nine,
                      hidden: false,
                    },
                  ],
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                      shoeIndex: 3,
                    },
                  ],
                },
              ],
            },
          ],
        } satisfies GameState,
      },
      expects: {
        throws: false,
        cardCount: 2,
        actionCount: 3,
        lastActionType: HandActionType.Stand,
        calls: {
          logError: { 0: [] },
        },
      },
    },
  ].map(testCase => {
    const dealer = testCase.inputs.game.players.find(
      player => player.playerId === DEALER_ID,
    )!
    for (const player of testCase.inputs.game.players) {
      for (const hand of player.hands) {
        hand.status = getHandStatus(hand, dealer.hands[0])
      }
    }
    return testCase
  })

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { game } = inputs
    const { throws, calls } = expects

    // Create a new logger with the silent option set to true
    const logger = getMockedLogger()

    let retGame: GameState | undefined
    if (throws !== false && typeof throws === 'object') {
      expect(() => maybeDealersTurn(game)).toThrow(throws)
    } else {
      await expect(
        (async () => {
          retGame = maybeDealersTurn(game)
          return retGame
        })(),
      ).resolves.toBeDefined()
      expect(retGame).toBeDefined()
      expect(retGame!.id).toBe(game.id)
      expect(retGame!.hash).toBe(game.hash)

      const dealerHand = getDealerHand(retGame!)
      expect(dealerHand.cards).toHaveLength(expects.cardCount)
      expect(dealerHand.actions).toHaveLength(expects.actionCount)
      expect(dealerHand.actions[dealerHand.actions.length - 1].type).toBe(
        expects.lastActionType,
      )
    }

    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logError,
      'logger.error',
    )
  })
})
