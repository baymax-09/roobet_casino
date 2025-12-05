import {
  canPlayHandAction,
  getActionTimestamp,
  getActivePlayerIdAndHandIndex,
  getDealerHand,
  getLastActionPlayerIdAndHandIndex,
  getLastPlayerIdAndHandIndex,
  getPlayerByIdOrThrow,
  getPlayerHandByIndex,
  getRandomSeed,
  getRemainingShoeAndNextIndex,
  getTableDealer,
  getTableDealerActive,
  isTableActive,
  lastShoeIndexFromGame,
  sortWagersByIndex,
  validatePlayerHandAction,
  validateWagers,
  wagerGroup,
} from '.'
import { generateHmac } from '../../game/lib/provably_fair/sharedAlgorithms'
import {
  BlackjackBadTableDealerError,
  BlackjackGameShoeExhaustedError,
  BlackjackInvalidActionError,
  BlackjackInvalidHandError,
  BlackjackInvalidWagersError,
  BlackjackMissingGameHashError,
  BlackjackNoUsableWagerError,
  BlackjackPlayerNotFoundError,
  BlackjackWrongPlayerHandError,
  CardSuitType,
  CardValueType,
  DEALER_ID,
  GameStatus,
  HandActionType,
  HandOutcomeType,
  HandStatusDefault,
  HandWagerType,
  WagerOutcomeType,
  getHandStatus,
  isPlayerHand,
  type DealerSeat,
  type GameState,
  type HandActions,
  type PlayerHand,
  type PlayerSeat,
  type Table,
  type UserHandMainWagerRequest,
  type UserHandWager,
} from '../lib'
import * as shoe from '../lib/shoe'
import {
  buildBasicDealtGame,
  buildBasicDealtGameWithPlayerId,
  buildBasicMainWager,
  buildBasicMainWagers,
  getMockedLogger,
  getObjectIdValue,
  getTimestamp,
} from '../test'

describe('Get Last Shoe Index', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = new Array(10).fill(0).map((_, index) => ({
    name: `Last Index From A New ${index + 1} Player Game`,
    inputs: {
      game: buildBasicDealtGame(index + 1),
    },
    expects: {
      throws: false,
      cardCount: (index + 1) * 2 + 2, // Two cards per player, plus two for the dealer
    },
  }))

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { game } = inputs
    const { throws, cardCount } = expects

    // Create a new logger with the silent option set to true
    getMockedLogger()

    if (throws) {
      expect(() => lastShoeIndexFromGame(game)).toThrow()
    } else {
      const lastShoeIndex = lastShoeIndexFromGame(game)
      expect(lastShoeIndex).toBe(cardCount - 1)
    }
  })
})

describe('Get Last Player ID And Hand Index', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validSeed = getRandomSeed()
  const validHash = generateHmac(validSeed, validSeed)
  const gameId = '786724b4-d41e-4da8-a25c-21b53b459e2b'
  const cases = [
    {
      name: 'Get The Last Player ID and Hand Index',
      inputs: {
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
                      timestamp: new Date(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 1,
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            } satisfies PlayerSeat,
            {
              playerId: DEALER_ID,
              hands: [
                {
                  handIndex: 0,
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
                      timestamp: new Date(),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 3,
                    },
                  ],
                },
              ],
            } satisfies DealerSeat,
          ],
        } satisfies GameState,
      },
      expects: {
        throws: false,
        playerId: '1',
        handIndex: 0,
        calls: {
          logError: { 0: [] },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { game } = inputs
    const { throws, playerId, handIndex, calls } = expects

    // Create a new logger with the silent option set to true
    const logger = getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      expect(() => getLastPlayerIdAndHandIndex(game)).toThrow(throws)
    } else {
      const { lastPlayerId, lastHandIndex } = getLastPlayerIdAndHandIndex(game)
      expect(lastPlayerId).toBe(playerId)
      expect(lastHandIndex).toBe(handIndex)
    }

    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logError,
      'logger.error',
    )
  })
})

describe('Get Most Recently Played Player ID And Hand Index', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validSeed = getRandomSeed()
  const validHash = generateHmac(validSeed, validSeed)
  const gameId = '786724b4-d41e-4da8-a25c-21b53b459e2b'
  const cases = [
    {
      name: 'Get The Last Player ID and Hand Index',
      inputs: {
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
                  wager: buildBasicMainWager(0),
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: false,
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
                  status: HandStatusDefault,
                },
              ],
            } satisfies PlayerSeat,
            {
              playerId: DEALER_ID,
              hands: [
                {
                  handIndex: 0,
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Eight,
                      hidden: true,
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
            } satisfies DealerSeat,
          ],
        } satisfies GameState,
      },
      expects: {
        throws: false,
        playerId: DEALER_ID,
        handIndex: 0,
        calls: {
          logError: { 0: [] },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { game } = inputs
    const { throws, playerId, handIndex, calls } = expects

    // Create a new logger with the silent option set to true
    const logger = getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      expect(() => getLastActionPlayerIdAndHandIndex(game)).toThrow(throws)
    } else {
      const { lastPlayerId, lastHandIndex } =
        getLastActionPlayerIdAndHandIndex(game)
      expect(lastPlayerId).toBe(playerId)
      expect(lastHandIndex).toBe(handIndex)
    }

    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logError,
      'logger.error',
    )
  })
})

describe('Get Table Dealer', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validSeed = getRandomSeed()
  const validHash = generateHmac(validSeed, validSeed)
  const gameId = '786724b4-d41e-4da8-a25c-21b53b459e2b'
  const cases = [
    {
      name: 'Gets The Dealer As Expected',
      inputs: {
        gameOrTable: {
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
                      timestamp: new Date(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 1,
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            } satisfies PlayerSeat,
            {
              playerId: DEALER_ID,
              hands: [
                {
                  handIndex: 0,
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
                      timestamp: new Date(),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 3,
                    },
                  ],
                },
              ],
            } satisfies DealerSeat,
          ],
        } satisfies GameState,
      },
      expects: {
        throws: false,
        playerId: '1',
        handIndex: 0,
        calls: {
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Errors When The Dealer Is Not Last',
      inputs: {
        gameOrTable: {
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
                      timestamp: new Date(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 1,
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            } satisfies PlayerSeat,
            {
              playerId: '2',
              hands: [
                {
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
                      timestamp: new Date(),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 3,
                    },
                  ],
                },
              ],
            } as unknown as DealerSeat, // Intentional invalid type cast
          ],
        } satisfies GameState,
      },
      expects: {
        throws: new BlackjackBadTableDealerError(gameId, expect.any(String)),
        playerId: '1',
        handIndex: 0,
        calls: {
          logError: {
            1: ['Blackjack Wrong Dealer Position', { gameId }],
          },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { gameOrTable } = inputs
    const { throws, calls } = expects
    const expectedPlayers = Array.isArray(gameOrTable)
      ? gameOrTable
      : gameOrTable.players

    // Create a new logger with the silent option set to true
    const logger = getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      expect(() => getTableDealer(gameOrTable)).toThrow(throws)
    } else {
      const dealer = getTableDealer(gameOrTable)
      expect(dealer).toBeDefined()
      expect(dealer.playerId).toBe(DEALER_ID)
      expect(dealer).toBe(expectedPlayers[expectedPlayers.length - 1])
    }

    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logError,
      'logger.error',
    )
  })
})

describe('Get Table Dealer Active', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validSeed = getRandomSeed()
  const validHash = generateHmac(validSeed, validSeed)
  const gameId = '786724b4-d41e-4da8-a25c-21b53b459e2b'
  const cases = [
    {
      name: 'Gets The Dealer As Expected',
      inputs: {
        gameOrTable: {
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
                      timestamp: new Date(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 1,
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            },
            {
              playerId: DEALER_ID,
              hands: [
                {
                  handIndex: 0,
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
                      timestamp: new Date(),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
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
        playerId: '1',
        handIndex: 0,
        calls: {
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Errors When The Dealer Is Not Active (Game)',
      inputs: {
        gameOrTable: {
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
                      timestamp: new Date(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 1,
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            },
            {
              playerId: DEALER_ID,
              hands: [],
            },
          ],
        } satisfies GameState,
      },
      expects: {
        throws: new BlackjackBadTableDealerError(gameId, expect.any(String)),
        playerId: '1',
        handIndex: 0,
        calls: {
          logError: {
            1: ['Blackjack Wrong Dealer Position', { gameId }],
          },
        },
      },
    },
    {
      name: 'Errors When The Dealer Is Not Active (Table)',
      inputs: {
        gameOrTable: [
          {
            playerId: '1',
            hands: [
              {
                handIndex: 0,
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
                    timestamp: new Date(),
                    shoeIndex: 0,
                  },
                  {
                    type: HandActionType.Deal,
                    timestamp: new Date(),
                    shoeIndex: 1,
                  },
                ],
                status: HandStatusDefault,
              },
            ],
          },
          {
            playerId: DEALER_ID,
            hands: [],
          },
        ] satisfies Table,
      },
      expects: {
        throws: new BlackjackBadTableDealerError(gameId, expect.any(String)),
        playerId: '1',
        handIndex: 0,
        calls: {
          logError: {
            1: ['Blackjack Wrong Dealer Position', { gameId: 'N/A' }],
          },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { gameOrTable } = inputs
    const { throws, calls } = expects
    const expectedPlayers = Array.isArray(gameOrTable)
      ? gameOrTable
      : gameOrTable.players

    // Create a new logger with the silent option set to true
    const logger = getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      expect(() => getTableDealerActive(gameOrTable)).toThrow(throws)
    } else {
      const dealer = getTableDealerActive(gameOrTable)
      expect(dealer).toBeDefined()
      expect(dealer.playerId).toBe(DEALER_ID)
      expect(dealer).toBe(expectedPlayers[expectedPlayers.length - 1])
    }

    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logError,
      'logger.error',
    )
  })
})

describe('Get Dealer Hand', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validSeed = getRandomSeed()
  const validHash = generateHmac(validSeed, validSeed)
  const gameId = '786724b4-d41e-4da8-a25c-21b53b459e2b'
  const cases = [
    {
      name: 'Gets The Dealer As Expected',
      inputs: {
        gameOrTable: {
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
                      timestamp: new Date(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 1,
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            },
            {
              playerId: DEALER_ID,
              hands: [
                {
                  handIndex: 0,
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
                      timestamp: new Date(),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
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
        handIndex: 0,
        calls: {
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Errors When The Dealer Is Not Active (Game)',
      inputs: {
        gameOrTable: {
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
                      timestamp: new Date(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 1,
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            },
            {
              playerId: DEALER_ID,
              hands: [],
            },
          ],
        } satisfies GameState,
      },
      expects: {
        throws: new BlackjackBadTableDealerError(gameId, expect.any(String)),
        handIndex: 0,
        calls: {
          logError: {
            1: ['Blackjack Wrong Dealer Position', { gameId }],
          },
        },
      },
    },
    {
      name: 'Errors When The Dealer Is Not Active (Table)',
      inputs: {
        gameOrTable: [
          {
            playerId: '1',
            hands: [
              {
                handIndex: 0,
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
                    timestamp: new Date(),
                    shoeIndex: 0,
                  },
                  {
                    type: HandActionType.Deal,
                    timestamp: new Date(),
                    shoeIndex: 1,
                  },
                ],
                status: HandStatusDefault,
              },
            ],
          },
          {
            playerId: DEALER_ID,
            hands: [],
          },
        ] satisfies Table,
      },
      expects: {
        throws: new BlackjackBadTableDealerError(gameId, expect.any(String)),
        handIndex: 0,
        calls: {
          logError: {
            1: ['Blackjack Wrong Dealer Position', { gameId: 'N/A' }],
          },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { gameOrTable } = inputs
    const { throws, handIndex, calls } = expects
    const expectedPlayers = Array.isArray(gameOrTable)
      ? gameOrTable
      : gameOrTable.players

    // Create a new logger with the silent option set to true
    const logger = getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      expect(() => getDealerHand(gameOrTable)).toThrow(throws)
    } else {
      const dealer = getDealerHand(gameOrTable)
      expect(dealer).toBeDefined()
      expect(dealer.handIndex).toBe(handIndex)
      expect(dealer).toBe(expectedPlayers[expectedPlayers.length - 1].hands[0])
    }

    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logError,
      'logger.error',
    )
  })
})

describe('Get Action Timestamp', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const fixedDate = new Date()
  const cases = [
    {
      name: 'Gets Timestamp From `Date` As Expected',
      inputs: {
        action: {
          type: HandActionType.Deal,
          timestamp: fixedDate,
          shoeIndex: 0,
        } satisfies HandActions,
      },
      expects: {
        timestamp: fixedDate,
      },
    },
    {
      name: 'Gets Timestamp From `number` As Expected',
      inputs: {
        action: {
          type: HandActionType.Deal,
          timestamp: fixedDate.valueOf(),
          shoeIndex: 0,
        } as unknown as HandActions,
      },
      expects: {
        timestamp: fixedDate,
      },
    },
    {
      name: 'Gets Timestamp From `string` As Expected',
      inputs: {
        action: {
          type: HandActionType.Deal,
          timestamp: fixedDate.toISOString(),
          shoeIndex: 0,
        } as unknown as HandActions,
      },
      expects: {
        timestamp: fixedDate,
      },
    },
    {
      name: 'Gets Timestamp From `string(number)` As Expected',
      inputs: {
        action: {
          type: HandActionType.Deal,
          timestamp: fixedDate.getTime().toString(),
          shoeIndex: 0,
        } as unknown as HandActions,
      },
      expects: {
        timestamp: fixedDate,
      },
    },
    {
      name: 'Gets `undefined` From `undefined` Action As Expected',
      inputs: {
        action: undefined,
      },
      expects: {
        timestamp: undefined,
      },
    },
    {
      name: 'Gets `undefined` From `boolean` Action As Expected',
      inputs: {
        action: {
          type: HandActionType.Deal,
          timestamp: true,
          shoeIndex: 0,
        } as unknown as HandActions,
      },
      expects: {
        timestamp: undefined,
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { action } = inputs
    const { timestamp } = expects

    const result = getActionTimestamp(action)
    expect(result).toEqual(timestamp)
  })
})

describe('Get Remaining Shoe And Next Index', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validSeed = getRandomSeed()
  const validHash = generateHmac(validSeed, validSeed)
  const gameId = '786724b4-d41e-4da8-a25c-21b53b459e2b'
  const cases = [
    {
      name: 'Works Properly As Expected',
      inputs: {
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
                      timestamp: new Date(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 1,
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            } satisfies PlayerSeat,
            {
              playerId: DEALER_ID,
              hands: [
                {
                  handIndex: 0,
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
                      timestamp: new Date(),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 3,
                    },
                  ],
                },
              ],
            } satisfies DealerSeat,
          ],
        } satisfies GameState,
      },
      expects: {
        throws: false,
        remainingShoeLength: 412,
        calls: {
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Errors When The Shoe Is Exhausted',
      inputs: {
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
                      timestamp: new Date(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 1,
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            } satisfies PlayerSeat,
            {
              playerId: DEALER_ID,
              hands: [
                {
                  handIndex: 0,
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
                      timestamp: new Date(),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 3,
                    },
                  ],
                },
              ],
            } satisfies DealerSeat,
          ],
        } satisfies GameState,
        getProvableShoe: new Array(3).fill(0),
      },
      expects: {
        throws: new BlackjackGameShoeExhaustedError(gameId, expect.any(String)),
        remainingShoeLength: 412,
        calls: {
          logError: {
            1: ['Blackjack Game Shoe Exhausted Error', { gameId }],
          },
        },
      },
    },
    {
      name: 'Errors Without Game Hash',
      inputs: {
        game: {
          id: gameId,
          seed: validSeed,
          hash: undefined,
          status: GameStatus.Active,
          players: [
            {
              playerId: '1',
              hands: [
                {
                  handIndex: 0,
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
                      timestamp: new Date(),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 1,
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            } satisfies PlayerSeat,
            {
              playerId: DEALER_ID,
              hands: [
                {
                  handIndex: 0,
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
                      timestamp: new Date(),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(),
                      shoeIndex: 3,
                    },
                  ],
                },
              ],
            } satisfies DealerSeat,
          ],
        } satisfies GameState,
        getProvableShoe: new Array(3).fill(0),
      },
      expects: {
        throws: new BlackjackMissingGameHashError(gameId, expect.any(String)),
        remainingShoeLength: 412,
        calls: {
          logError: {
            1: ['Blackjack Missing Game Hash Error', { gameId }],
          },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { game, getProvableShoe } = inputs
    const { throws, remainingShoeLength, calls } = expects

    if (getProvableShoe) {
      jest.spyOn(shoe, 'getProvableShoe').mockReturnValue(getProvableShoe)
    }

    // Create a new logger with the silent option set to true
    const logger = getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      expect(() => getRemainingShoeAndNextIndex(game)).toThrow(throws)
    } else {
      const lastShoeIndex = lastShoeIndexFromGame(game)
      const { remainingShoe, nextIndex } = getRemainingShoeAndNextIndex(game)
      expect(remainingShoe).toHaveLength(remainingShoeLength)
      expect(nextIndex).toBe(lastShoeIndex + 1)
    }

    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logError,
      'logger.error',
    )
  })
})

describe('Grouped Wagers', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Groups Demo Wagers As Expected',
      inputs: {
        requests: [
          {
            user: {},
            wagers: buildBasicMainWagers([0, 0, 0, 0, 0]),
          },
        ],
      },
      expects: {
        throws: false,
        groupName: 'demo',
        userCount: 1,
        wagerCount: 5,
      },
    },
    {
      name: 'Groups Live Wagers As Expected',
      inputs: {
        requests: [
          {
            user: {},
            wagers: buildBasicMainWagers([100, 100, 100, 100, 100]),
          },
        ],
      },
      expects: {
        throws: false,
        groupName: 'live',
        userCount: 1,
        wagerCount: 5,
      },
    },
    {
      name: 'Errors Without Wagers As Expected',
      inputs: {
        requests: [
          {
            user: {},
            wagers: buildBasicMainWagers([]),
          },
        ],
      },
      expects: {
        throws: new BlackjackNoUsableWagerError(
          expect.any(String),
          expect.any(String),
        ),
        groupName: 'live',
        userCount: 1,
        wagerCount: 5,
      },
    },
    {
      name: 'Errors On Dead Wagers As Expected',
      inputs: {
        requests: [
          {
            user: {},
            wagers: buildBasicMainWagers([0.05, 0.15, 0.25, 0.35, 0.45]),
          },
        ],
      },
      expects: {
        throws: new BlackjackInvalidWagersError(
          expect.any(String),
          expect.any(String),
        ),
        groupName: 'live',
        userCount: 1,
        wagerCount: 5,
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { requests } = inputs
    const { throws, groupName, userCount, wagerCount } = expects

    getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      expect(() => validateWagers('123', requests)).toThrow(throws)
    } else {
      const [group, seats] = validateWagers('123', requests)
      const allWagers = seats.reduce(
        (pre, cur) => [...pre, ...cur.wagers],
        [] as UserHandMainWagerRequest[],
      )
      expect(group).toBe(groupName)
      expect(seats).toHaveLength(userCount)
      expect(allWagers).toHaveLength(wagerCount)
    }
  })
})

describe('Get Random Seed', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test("1K Random Seeds Don't Collide", () => {
    // Generate seeds without duplicates
    Array(1000)
      .fill(0)
      .map(() => getRandomSeed())
      .reduce((acc, seed) => {
        expect(acc).not.toContain(seed)
        return [...acc, seed]
      }, [] as string[])
  })
})

describe('Can Play Hand Action', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const dealerCards = [
    { suit: CardSuitType.Clubs, value: CardValueType.Ace, hidden: false },
    { suit: CardSuitType.Clubs, value: CardValueType.Eight, hidden: true },
  ]
  const cases = [
    {
      name: 'Disallows Unsupported Actions As Expected',
      inputs: {
        action:
          Math.max(
            ...(Object.values(HandActionType).filter(
              a => typeof a === 'number',
            ) as number[]),
          ) + 1,
        dealerCards: undefined,
        hand: {
          handIndex: 0,
          wager: buildBasicMainWager(0),
          cards: [
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Eight,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Eight,
              hidden: false,
            },
          ],
          actions: [
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 0 },
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 1 },
          ],
          status: HandStatusDefault,
        } satisfies PlayerHand,
      },
      expects: {
        result: false,
      },
    },
    {
      name: 'Allows Hit As Expected',
      inputs: {
        action: HandActionType.Hit,
        dealerCards: undefined,
        hand: {
          handIndex: 0,
          wager: buildBasicMainWager(0),
          cards: [
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Eight,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Eight,
              hidden: false,
            },
          ],
          actions: [
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 0 },
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 1 },
          ],
          status: HandStatusDefault,
        } satisfies PlayerHand,
      },
      expects: {
        result: true,
      },
    },
    {
      name: 'Disallows Hit As Expected',
      inputs: {
        action: HandActionType.Hit,
        dealerCards: undefined,
        hand: {
          handIndex: 0,
          wager: buildBasicMainWager(0),
          cards: [
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Two,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.King,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.King,
              hidden: false,
            },
          ],
          actions: [
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 0 },
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 1 },
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 4 },
          ],
          status: HandStatusDefault,
        } satisfies PlayerHand,
      },
      expects: {
        result: false,
      },
    },
    {
      name: 'Allows Split As Expected',
      inputs: {
        action: HandActionType.Split,
        dealerCards: undefined,
        hand: {
          handIndex: 0,
          wager: buildBasicMainWager(0),
          cards: [
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Eight,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Eight,
              hidden: false,
            },
          ],
          actions: [
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 0 },
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 1 },
          ],
          status: HandStatusDefault,
        } satisfies PlayerHand,
      },
      expects: {
        result: true,
      },
    },
    {
      name: 'Disallows Split As Expected',
      inputs: {
        action: HandActionType.Split,
        dealerCards: undefined,
        hand: {
          handIndex: 0,
          wager: buildBasicMainWager(0),
          cards: [
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Queen,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.King,
              hidden: false,
            },
          ],
          actions: [
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 0 },
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 1 },
          ],
          status: HandStatusDefault,
        } satisfies PlayerHand,
      },
      expects: {
        result: false,
      },
    },
    {
      name: 'Allows Stand As Expected',
      inputs: {
        action: HandActionType.Stand,
        dealerCards: undefined,
        hand: {
          handIndex: 0,
          wager: buildBasicMainWager(0),
          cards: [
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Eight,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Eight,
              hidden: false,
            },
          ],
          actions: [
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 0 },
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 1 },
          ],
          status: HandStatusDefault,
        } satisfies PlayerHand,
      },
      expects: {
        result: true,
      },
    },
    {
      name: 'Disallows Stand As Expected',
      inputs: {
        action: HandActionType.Stand,
        dealerCards: undefined,
        hand: {
          handIndex: 0,
          wager: buildBasicMainWager(0),
          cards: [
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Queen,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Nine,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Two,
              hidden: false,
            },
          ],
          actions: [
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 0 },
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 1 },
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 4 },
          ],
          status: HandStatusDefault,
        } satisfies PlayerHand,
      },
      expects: {
        result: false,
      },
    },
    {
      name: 'Allows Insurance As Expected',
      inputs: {
        action: HandActionType.Insurance,
        dealerCards: [
          { suit: CardSuitType.Clubs, value: CardValueType.Ace, hidden: false },
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
            hidden: true,
          },
        ],
        hand: {
          handIndex: 0,
          wager: buildBasicMainWager(0),
          cards: [
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Eight,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Eight,
              hidden: false,
            },
          ],
          actions: [
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 0 },
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 1 },
          ],
          status: HandStatusDefault,
        } satisfies PlayerHand,
      },
      expects: {
        result: true,
      },
    },
    {
      name: 'Disallows Insurance As Expected',
      inputs: {
        action: HandActionType.Insurance,
        dealerCards: [
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
            hidden: false,
          },
          { suit: CardSuitType.Clubs, value: CardValueType.Ace, hidden: true },
        ],
        hand: {
          handIndex: 0,
          wager: buildBasicMainWager(0),
          cards: [
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Queen,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Nine,
              hidden: false,
            },
          ],
          actions: [
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 0 },
            { type: HandActionType.Deal, timestamp: new Date(), shoeIndex: 1 },
          ],
          status: HandStatusDefault,
        } satisfies PlayerHand,
      },
      expects: {
        result: false,
      },
    },
  ].map(cse => {
    const dealerHand = {
      actions: [],
      handIndex: 0,
      wager: buildBasicMainWager(0),
      status: HandStatusDefault,
      cards: cse.inputs.dealerCards ?? dealerCards,
    }
    cse.inputs.hand.status = getHandStatus(cse.inputs.hand, dealerHand)
    return cse
  })

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { action, hand } = inputs
    const { result } = expects

    // Silence logger with a mock
    getMockedLogger()

    const actual = canPlayHandAction(
      action,
      { playerId: 'test', hands: [hand] },
      0,
    )
    expect(actual).toBe(result)
  })
})

describe('Validate Player Hand Action', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const invalidPlayerId = getObjectIdValue()
  const { game, playerId } = buildBasicDealtGameWithPlayerId()
  const playerStatus = game.players[0].hands[0]?.status
  const failAction = !playerStatus?.canInsure
    ? HandActionType.Insurance
    : !playerStatus.canSplit
      ? HandActionType.Split
      : !playerStatus.canDoubleDown
        ? HandActionType.DoubleDown
        : HandActionType.Stand
  const cases = [
    {
      name: 'Returns Player Seat As Expected',
      inputs: {
        game,
        playerId,
        handIndex: 0,
        action: HandActionType.Hit,
      },
      expects: {
        throws: false,
        calls: {
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Throws When The Player Is Not In The Game',
      inputs: {
        game,
        playerId: invalidPlayerId,
        handIndex: 0,
        action: HandActionType.Hit,
      },
      expects: {
        throws: new BlackjackPlayerNotFoundError(
          game.id,
          expect.any(String),
          invalidPlayerId,
        ),
        calls: {
          logError: {
            1: [
              'Blackjack Player Not Found',
              { gameId: game.id, playerId: invalidPlayerId },
            ],
          },
        },
      },
    },
    {
      name: 'Throws When Not The Active Player ID',
      inputs: {
        game: {
          ...game,
          players: [
            {
              ...game.players[0],
              hands: [
                {
                  ...game.players[0].hands[0],
                  actions: [
                    ...game.players[0].hands[0]!.actions,
                    { type: HandActionType.Stand, timestamp: new Date() },
                  ],
                },
              ],
            },
            { ...game.players[1] },
          ],
        } as unknown as GameState,
        playerId,
        handIndex: 0,
        action: HandActionType.Hit,
      },
      expects: {
        throws: new BlackjackWrongPlayerHandError(
          game.id,
          expect.any(String),
          playerId,
          expect.any(String),
          0,
          0,
        ),
        calls: {
          logError: {
            1: [
              'Blackjack Wrong Player Hand',
              {
                gameId: game.id,
                playerId,
                activePlayerId: DEALER_ID,
                handIndex: 0,
                activeHandIndex: 0,
              },
            ],
          },
        },
      },
    },
    {
      name: 'Throws When Not The Active Hand Index',
      inputs: {
        game: {
          ...game,
          players: [
            {
              ...game.players[0],
              hands: [
                {
                  ...game.players[0].hands[0],
                  actions: [
                    ...game.players[0].hands[0]!.actions,
                    { type: HandActionType.Stand, timestamp: new Date() },
                  ],
                },
                {
                  ...game.players[0].hands[0],
                  handIndex: 1,
                },
              ],
            },
            { ...game.players[1] },
          ],
        } as unknown as GameState,
        playerId,
        handIndex: 0,
        action: HandActionType.Hit,
      },
      expects: {
        throws: new BlackjackWrongPlayerHandError(
          game.id,
          expect.any(String),
          playerId,
          expect.any(String),
          0,
          0,
        ),
        calls: {
          logError: {
            1: [
              'Blackjack Wrong Player Hand',
              {
                gameId: game.id,
                playerId,
                activePlayerId: playerId,
                handIndex: 0,
                activeHandIndex: 1,
              },
            ],
          },
        },
      },
    },
    {
      name: 'Throws The Action Is Not Allowed On The Hand',
      inputs: {
        game,
        playerId,
        handIndex: 0,
        action: failAction,
      },
      expects: {
        throws: new BlackjackInvalidActionError(
          game.id,
          expect.any(String),
          playerId,
          0,
          failAction,
        ),
        calls: {
          logError: {
            1: [
              'Blackjack Invalid Action',
              {
                gameId: game.id,
                playerId,
                handIndex: 0,
                action: failAction,
              },
            ],
          },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { game, playerId, handIndex, action } = inputs
    const { throws, calls } = expects

    // Create a new logger with the silent option set to true
    const logger = getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      expect(() =>
        validatePlayerHandAction(game, playerId, handIndex, action),
      ).toThrow(throws)
    } else {
      expect(() =>
        validatePlayerHandAction(game, playerId, handIndex, action),
      ).not.toThrow()
    }

    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logError,
      'logger.error',
    )
  })
})

describe('Is Table Active', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Is Active With A Playable Hand',
      inputs: {
        table: [
          {
            playerId: getObjectIdValue(),
            hands: [
              {
                handIndex: 0,
                wager: buildBasicMainWager(0),
                cards: [
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.Eight,
                    hidden: false,
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
                status: HandStatusDefault,
              },
            ],
          },
          {
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
                    value: CardValueType.Eight,
                    hidden: true,
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
                status: HandStatusDefault,
              },
            ],
          },
        ] satisfies Table,
      },
      expects: {
        result: true,
      },
    },
    {
      name: 'Is Active With All Standing',
      inputs: {
        table: [
          {
            playerId: getObjectIdValue(),
            hands: [
              {
                handIndex: 0,
                wager: buildBasicMainWager(0),
                cards: [
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.Eight,
                    hidden: false,
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
                  { type: HandActionType.Stand, timestamp: getTimestamp() },
                ],
                status: HandStatusDefault,
              },
            ],
          },
          {
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
                    value: CardValueType.Eight,
                    hidden: true,
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
                  { type: HandActionType.Stand, timestamp: getTimestamp() },
                ],
                status: HandStatusDefault,
              },
            ],
          },
        ] as Table,
      },
      expects: {
        result: false,
      },
    },
    {
      name: 'Is Active With Player Blackjack',
      inputs: {
        table: [
          {
            playerId: getObjectIdValue(),
            hands: [
              {
                handIndex: 0,
                wager: buildBasicMainWager(0),
                cards: [
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.Ten,
                    hidden: false,
                  },
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.Ace,
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
                  { type: HandActionType.Stand, timestamp: getTimestamp() },
                ],
                status: HandStatusDefault,
              },
            ],
          },
          {
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
                    value: CardValueType.Eight,
                    hidden: true,
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
                  { type: HandActionType.Stand, timestamp: getTimestamp() },
                ],
                status: HandStatusDefault,
              },
            ],
          },
        ] as Table,
      },
      expects: {
        result: false,
      },
    },
    {
      name: 'Is Active With Dealer Blackjack',
      inputs: {
        table: [
          {
            playerId: getObjectIdValue(),
            hands: [
              {
                handIndex: 0,
                wager: buildBasicMainWager(0),
                cards: [
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.Eight,
                    hidden: false,
                  },
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.Ace,
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
                  { type: HandActionType.Stand, timestamp: getTimestamp() },
                ],
                status: HandStatusDefault,
              },
            ],
          },
          {
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
                    value: CardValueType.Ten,
                    hidden: true,
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
                  { type: HandActionType.Stand, timestamp: getTimestamp() },
                ],
                status: HandStatusDefault,
              },
            ],
          },
        ] as Table,
      },
      expects: {
        result: false,
      },
    },
    {
      name: 'Is Active With Player Bust',
      inputs: {
        table: [
          {
            playerId: getObjectIdValue(),
            hands: [
              {
                handIndex: 0,
                wager: buildBasicMainWager(0),
                cards: [
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.King,
                    hidden: false,
                  },
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.Queen,
                    hidden: false,
                  },
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.Queen,
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
                    timestamp: getTimestamp(),
                    shoeIndex: 4,
                  },
                ],
                status: HandStatusDefault,
              },
            ],
          },
          {
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
                    value: CardValueType.Eight,
                    hidden: true,
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
                  { type: HandActionType.Stand, timestamp: getTimestamp() },
                ],
                status: HandStatusDefault,
              },
            ],
          },
        ] as Table,
      },
      expects: {
        result: false,
      },
    },
    {
      name: 'Is Active With Dealer Bust',
      inputs: {
        table: [
          {
            playerId: getObjectIdValue(),
            hands: [
              {
                handIndex: 0,
                wager: buildBasicMainWager(0),
                cards: [
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.King,
                    hidden: false,
                  },
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.Queen,
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
                  { type: HandActionType.Stand, timestamp: getTimestamp() },
                ],
                status: HandStatusDefault,
              },
            ],
          },
          {
            playerId: DEALER_ID,
            hands: [
              {
                handIndex: 0,
                cards: [
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.King,
                    hidden: false,
                  },
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.Six,
                    hidden: true,
                  },
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.Eight,
                    hidden: true,
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
                  {
                    type: HandActionType.Hit,
                    timestamp: getTimestamp(),
                    shoeIndex: 4,
                  },
                ],
                status: HandStatusDefault,
              },
            ],
          },
        ] as Table,
      },
      expects: {
        result: false,
      },
    },
    {
      name: 'Is Active With Dealer @ 18 & Player @ 15',
      inputs: {
        table: [
          {
            playerId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
            betId: 'ea8b333c-0f40-4511-89ea-0c1dea0e92fc',
            hands: [
              {
                handIndex: 0,
                wager: {
                  type: HandWagerType.Main,
                  amount: 100,
                  sides: [
                    {
                      type: HandWagerType.PerfectPair,
                      amount: 100,
                      outcome: WagerOutcomeType.Loss,
                    },
                  ],
                },
                cards: [
                  {
                    suit: CardSuitType.Spades,
                    value: CardValueType.Two,
                    hidden: false,
                  },
                  {
                    suit: CardSuitType.Diamonds,
                    value: CardValueType.Five,
                    hidden: false,
                  },
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.Eight,
                    hidden: false,
                  },
                ],
                status: {
                  value: 15,
                  isHard: true,
                  isSoft: false,
                  isBust: false,
                  isBlackjack: false,
                  canHit: true,
                  canStand: true,
                  canInsure: false,
                  canSplit: false,
                  canDoubleDown: false,
                  splitFrom: null,
                  wasDoubled: false,
                  outcome: HandOutcomeType.Unknown,
                },
                actions: [
                  {
                    type: HandActionType.Deal,
                    timestamp: new Date(1706642497460),
                    shoeIndex: 0,
                  },
                  {
                    type: HandActionType.Deal,
                    timestamp: new Date(1706642497460),
                    shoeIndex: 1,
                  },
                  {
                    type: HandActionType.Hit,
                    timestamp: new Date(1706642502867),
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
                cards: [
                  {
                    suit: CardSuitType.Hearts,
                    value: CardValueType.Queen,
                    hidden: false,
                  },
                  {
                    suit: CardSuitType.Clubs,
                    value: CardValueType.Eight,
                    hidden: false,
                  },
                ],
                status: {
                  value: 18,
                  isHard: true,
                  isSoft: false,
                  isBust: false,
                  isBlackjack: false,
                  canHit: true,
                  canStand: true,
                  canInsure: false,
                  canSplit: false,
                  canDoubleDown: true,
                  splitFrom: null,
                  wasDoubled: false,
                  outcome: HandOutcomeType.Unknown,
                },
                actions: [
                  {
                    type: HandActionType.Deal,
                    timestamp: new Date(1706642497460),
                    shoeIndex: 2,
                  },
                  {
                    type: HandActionType.Deal,
                    timestamp: new Date(1706642497460),
                    shoeIndex: 3,
                  },
                  {
                    type: HandActionType.Stand,
                    timestamp: new Date(1706642502867),
                  },
                ],
              },
            ],
          },
        ] satisfies Table,
      },
      expects: {
        result: true,
      },
    },
  ].map(testCase => {
    const dealerHand = getDealerHand(testCase.inputs.table)
    for (const seat of testCase.inputs.table) {
      seat.hands[0]!.status = getHandStatus(seat.hands[0]!, dealerHand)
    }
    return testCase
  })

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { table } = inputs
    const { result } = expects

    expect(isTableActive(table)).toBe(result)
  })
})

describe('Get Player Hand By Index', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const makeCases = (handCount: number, targetHand: number) => {
    const { game, playerId } = buildBasicDealtGameWithPlayerId(1, handCount)
    const handCases = new Array(handCount).fill(0).map((_, i) => i)
    return handCases.map(targetIndex => ({
      name: `Gets Hand ${targetIndex} from ${handCount} By Index As Expected`,
      inputs: {
        ...buildBasicDealtGameWithPlayerId(1, handCount),
        getIndex: targetIndex,
      },
      expects: {
        throws:
          targetHand !== handCount
            ? false
            : new BlackjackInvalidHandError(
                game.id,
                expect.any(String),
                playerId,
                targetIndex,
              ),
        handIndex: targetIndex,
      },
    }))
  }

  const handCounts = [1, 2, 3, 4, 5, 6, 7]
  const cases = handCounts
    .map(handCount => makeCases(handCount, handCount - 1))
    .flat()
    .concat([
      {
        name: 'Throws When The Hand Index Is Invalid',
        inputs: {
          ...buildBasicDealtGameWithPlayerId(1, 1),
          getIndex: 2,
        },
        expects: {
          throws: new BlackjackInvalidHandError(
            expect.any(String),
            expect.any(String),
            expect.any(String),
            2,
          ),
          handIndex: 1,
        },
      },
    ])

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { game, playerId, getIndex } = inputs
    const { throws, handIndex } = expects

    // Silence logger with a mock
    getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      expect(() => getPlayerHandByIndex(game, playerId, getIndex)).toThrow(
        throws,
      )
    } else {
      let hand: PlayerHand | undefined
      expect(() => {
        hand = getPlayerHandByIndex(game, playerId, getIndex).hand
      }).not.toThrow()
      expect(hand).toBeDefined()
      expect(hand).toBe(game.players[0].hands[handIndex])
      expect(game.players[0].playerId).toBe(playerId)
      expect(isPlayerHand(hand!)).toBe(true)
      expect(hand?.handIndex).toBe(handIndex)
    }
  })
})

describe('Sort Wagers By Hand Index', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const setRandomHandIndex = (
    wager: UserHandMainWagerRequest,
  ): UserHandMainWagerRequest => {
    wager.handIndex = Math.floor(Math.random() * 10)
    return wager
  }

  const makeCases = (handCount: number) => ({
    name: `Sorts ${handCount} Hand${
      handCount > 1 ? 's' : ''
    } By Index As Expected`,
    inputs: {
      wagers: buildBasicMainWagers(
        new Array(handCount).fill(0).map((_, i) => (i + handCount) * 100),
      ).map(setRandomHandIndex),
    },
  })

  const handCounts = [1, 2, 3, 4, 5, 6, 7]
  const cases = handCounts.map(handCount => makeCases(handCount)).flat()

  it.each(cases)('$name', async ({ inputs }) => {
    const { wagers } = inputs

    // Silence logger with a mock
    getMockedLogger()

    const sortedWagers = [...wagers].sort(sortWagersByIndex)
    expect(sortedWagers).toHaveLength(wagers.length)
    expect(sortedWagers).toEqual(expect.arrayContaining(wagers))
    expect(
      sortedWagers.every((wager, ndx, arr) => {
        return (arr[ndx - 1]?.handIndex ?? -1) <= (wager.handIndex ?? 0)
      }),
    ).toBe(true)
  })
})

describe('Get Active Player ID And Hand Index', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const { game, playerId } = buildBasicDealtGameWithPlayerId(1, 1)
  const cases = [
    {
      name: 'Gets Active Player ID And Hand Index As Expected',
      inputs: {
        game,
      },
      expects: {
        result: {
          playerId,
          handIndex: 0,
        },
      },
    },
    {
      name: 'Gets Dealer When All Players Are Complete',
      inputs: {
        game: {
          ...game,
          players: [
            {
              ...game.players[0],
              hands: [
                {
                  ...game.players[0].hands[0],
                  actions: [
                    ...game.players[0].hands[0]!.actions,
                    { type: HandActionType.Stand, timestamp: new Date() },
                  ],
                },
              ],
            },
            { ...game.players[1] },
          ],
        } as unknown as GameState,
      },
      expects: {
        result: {
          playerId: DEALER_ID,
          handIndex: 0,
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { game } = inputs
    const { result } = expects

    // Silence logger with a mock
    getMockedLogger()

    const actual = getActivePlayerIdAndHandIndex(game)
    const transformed = {
      playerId: actual.activePlayerId,
      handIndex: actual.activeHandIndex,
    }
    expect(transformed).toEqual(result)
  })
})

describe('Sort Wagers By Index', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Sorts Wagers By Index As Expected',
      inputs: {
        wagers: buildBasicMainWagers([100, 200, 300, 400, 500])
          .map((wager, ndx) => ({ ...wager, handIndex: ndx }))
          .reverse() satisfies UserHandMainWagerRequest[],
      },
      expects: {
        result: buildBasicMainWagers([100, 200, 300, 400, 500]).map(
          (wager, ndx) => ({ ...wager, handIndex: ndx }),
        ) satisfies UserHandMainWagerRequest[],
      },
    },
    {
      name: 'Sorts Wagers Without Index As Expected',
      inputs: {
        wagers: buildBasicMainWagers([100, 200, 300, 400, 500])
          .map(wager => ({ ...wager, handIndex: undefined }))
          .reverse() satisfies UserHandMainWagerRequest[],
      },
      expects: {
        result: buildBasicMainWagers([100, 200, 300, 400, 500]).map(wager => ({
          ...wager,
        })) satisfies UserHandMainWagerRequest[],
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { wagers } = inputs
    const { result } = expects

    // Silence logger with a mock
    getMockedLogger()

    const sortedWagers = [...wagers].sort(sortWagersByIndex)
    expect(sortedWagers).toHaveLength(wagers.length)
    expect(sortedWagers).toEqual(expect.arrayContaining(result))
    expect(
      sortedWagers.every((wager, ndx, arr) => {
        return (arr[ndx - 1]?.handIndex ?? -1) <= (wager.handIndex ?? 0)
      }),
    ).toBe(true)
  })
})

describe('Get Player By ID Or Throw', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const invalidPlayerId = getObjectIdValue()
  const { game, playerId } = buildBasicDealtGameWithPlayerId()
  const cases = [
    {
      name: 'Returns Player As Expected',
      inputs: {
        game,
        playerId,
      },
      expects: {
        throws: false,
        result: game.players[0],
      },
    },
    {
      name: 'Throws When The Player Is Not In The Game',
      inputs: {
        game,
        playerId: invalidPlayerId,
      },
      expects: {
        throws: new BlackjackPlayerNotFoundError(
          game.id,
          expect.any(String),
          invalidPlayerId,
        ),
        result: undefined,
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { game, playerId } = inputs
    const { throws, result } = expects

    // Silence logger with a mock
    getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      expect(() => getPlayerByIdOrThrow(game, playerId)).toThrow(throws)
    } else {
      expect(getPlayerByIdOrThrow(game, playerId)).toEqual(result)
    }
  })
})

describe('Wager Group', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Returns `live` for Insurance Wagers',
      inputs: {
        wager: {
          type: HandWagerType.Insurance,
          amount: 100,
          outcome: WagerOutcomeType.Unknown,
        } satisfies UserHandWager,
      },
      expects: {
        result: 'live',
      },
    },
    {
      name: 'Returns `dead` for Mixed Wagers',
      inputs: {
        wager: {
          type: HandWagerType.Main,
          amount: 100,
          sides: [
            {
              type: HandWagerType.PerfectPair,
              amount: 0.45,
              outcome: WagerOutcomeType.Unknown,
            },
          ],
        } satisfies UserHandWager,
      },
      expects: {
        result: 'dead',
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { wager } = inputs
    const { result } = expects

    // Silence logger with a mock
    getMockedLogger()

    expect(wagerGroup(wager)).toBe(result)
  })
})
