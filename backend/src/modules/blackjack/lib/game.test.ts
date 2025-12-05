import { MutexLock } from '../../../util/named-lock'
import * as cache from '../../../util/redisModels/basicCache'
import * as activeBetDoc from '../../bet/documents/active_bet'
import { type ActiveBet, type BetHistory } from '../../bet/types'
import { generateHmac } from '../../game/lib/provably_fair/sharedAlgorithms'
import * as gameDoc from '../documents/blackjackGames'
import * as histDoc from '../documents/blackjackHistory'
import {
  buildBasicDealtGame,
  buildBasicDealtGameWithPlayerId,
  buildBasicMainWager,
  buildBasicMainWagers,
  getMockedLogger,
  getObjectIdValue,
  getTimestamp,
} from '../test'
import {
  BLACKJACK_GAME_NAME,
  BlackjackDealerStatusError,
  BlackjackGameNotFoundError,
  BlackjackInvalidCloseoutError,
  BlackjackMutexError,
  BlackjackNoActiveWagerError,
  CardSuitType,
  CardValueType,
  DEALER_HOLE_INDEX,
  DEALER_ID,
  DealerSeatDefault,
  GameStatus,
  HandActionType,
  HandOutcomeType,
  HandStatusDefault,
  HandWagerType,
  WagerOutcomeType,
  isDealerSeat,
  type DealerSeat,
  type GameState,
  type PlayerHand,
  type PlayerSeat,
  type PlayerSeatRequest,
  type PlayerSeatWithLiveWager,
} from '../types'
import {
  type ActiveBetWithWagers,
  type PlayerSeatCloseOut,
} from '../types/bets'
import * as utilsLib from '../utils'
import { getHandStatus } from './calculator'
import * as dealerLib from './dealer'
import * as gameLib from './game'

describe('Create Game', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Creates A Game As Expected',
      inputs: {
        hash: utilsLib.getRandomSeed(),
        playerId: 'test',
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs }) => {
    const { hash, playerId } = inputs

    // Mock
    jest
      .spyOn(gameDoc, 'createGame')
      .mockResolvedValue(Promise.resolve({} as unknown as GameState))

    // Test
    await expect(gameLib.createGame(hash, playerId)).resolves.toBeDefined()

    // Assert
    expect(gameDoc.createGame).toHaveBeenCalledTimes(1)
  })
})

describe('Start Game', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validGameId = getObjectIdValue()
  const cases = [
    {
      name: 'Deals The Dealer As The Last Player',
      inputs: {
        id: validGameId,
        seed: 'dvaXhQOZXbVK23u1E0WxU6F16SvgE7Trp7gzADMr2cAa69C2meqgMFxpNZlXuoglrjX1J573uFoXHWxRF8YgVutPBcjWBtWrgzCHMxMBEjzkOSiRdefz1jml6asV0Y0ksGXbk0Z3o4oGCC1dpRNv8XHuYx3bT0q7vo7zqwOsdODwXYjNVyQxXzuJeOg5qCQPErwfCAkU0gVGaIIy7Tedov2vfG5zw08u0odVRXVc86AefiXw5osklVs1HU2Qwdj4',
        hash: 'LlSI47cWzyr1vykkJhVwsF0YxLBSv9fi5fjONdlgvpzZEoRugciGWrKfjfE7fSfISdEc3FXoYqPe4ShV0cdBZrSldwEKCUtLG0cooZ0vTvP6hJ4G4f0DfSxoXtbJaYX56sSfJyjYUj3AIxNK24hzJxP1z2CnEc9u390loW2Mv5HCcMK8SvwLWLQ9Bk6akWmTjLdFUEmYloGwBRqWYrcbMqq5Y2DQZnfJVOuueSNYXGZmZVs0VbkmcIj4GxYL2ogP',
        seats: [
          { playerId: getObjectIdValue(), wagers: buildBasicMainWagers([100]) },
        ] satisfies PlayerSeatRequest[],
        exists: true,
      },
      expects: {
        throws: false,
      },
    },
    {
      name: 'Starts A Multi-hand Game As Expected',
      inputs: {
        id: validGameId,
        seed: 'dvaXhQOZXbVK23u1E0WxU6F16SvgE7Trp7gzADMr2cAa69C2meqgMFxpNZlXuoglrjX1J573uFoXHWxRF8YgVutPBcjWBtWrgzCHMxMBEjzkOSiRdefz1jml6asV0Y0ksGXbk0Z3o4oGCC1dpRNv8XHuYx3bT0q7vo7zqwOsdODwXYjNVyQxXzuJeOg5qCQPErwfCAkU0gVGaIIy7Tedov2vfG5zw08u0odVRXVc86AefiXw5osklVs1HU2Qwdj4',
        hash: 'LlSI47cWzyr1vykkJhVwsF0YxLBSv9fi5fjONdlgvpzZEoRugciGWrKfjfE7fSfISdEc3FXoYqPe4ShV0cdBZrSldwEKCUtLG0cooZ0vTvP6hJ4G4f0DfSxoXtbJaYX56sSfJyjYUj3AIxNK24hzJxP1z2CnEc9u390loW2Mv5HCcMK8SvwLWLQ9Bk6akWmTjLdFUEmYloGwBRqWYrcbMqq5Y2DQZnfJVOuueSNYXGZmZVs0VbkmcIj4GxYL2ogP',
        seats: [
          {
            playerId: getObjectIdValue(),
            seatIndex: 0,
            wagers: [
              {
                type: HandWagerType.Main,
                amount: 100,
                handIndex: 2,
                sides: undefined,
              },
              {
                type: HandWagerType.Main,
                amount: 100,
                handIndex: 3,
                sides: undefined,
              },
            ],
          },
        ] satisfies PlayerSeatRequest[],
        exists: true,
      },
      expects: {
        throws: false,
      },
    },
    {
      name: 'Throws Starting a Non-Existent Game',
      inputs: {
        id: validGameId,
        seed: 'dvaXhQOZXbVK23u1E0WxU6F16SvgE7Trp7gzADMr2cAa69C2meqgMFxpNZlXuoglrjX1J573uFoXHWxRF8YgVutPBcjWBtWrgzCHMxMBEjzkOSiRdefz1jml6asV0Y0ksGXbk0Z3o4oGCC1dpRNv8XHuYx3bT0q7vo7zqwOsdODwXYjNVyQxXzuJeOg5qCQPErwfCAkU0gVGaIIy7Tedov2vfG5zw08u0odVRXVc86AefiXw5osklVs1HU2Qwdj4',
        hash: 'LlSI47cWzyr1vykkJhVwsF0YxLBSv9fi5fjONdlgvpzZEoRugciGWrKfjfE7fSfISdEc3FXoYqPe4ShV0cdBZrSldwEKCUtLG0cooZ0vTvP6hJ4G4f0DfSxoXtbJaYX56sSfJyjYUj3AIxNK24hzJxP1z2CnEc9u390loW2Mv5HCcMK8SvwLWLQ9Bk6akWmTjLdFUEmYloGwBRqWYrcbMqq5Y2DQZnfJVOuueSNYXGZmZVs0VbkmcIj4GxYL2ogP',
        seats: [
          {
            playerId: getObjectIdValue(),
            seatIndex: 0,
            wagers: [
              {
                type: HandWagerType.Main,
                amount: 100,
                handIndex: 2,
                sides: undefined,
              },
              {
                type: HandWagerType.Main,
                amount: 100,
                handIndex: 3,
                sides: undefined,
              },
            ],
          },
        ] satisfies PlayerSeatRequest[],
        exists: false,
      },
      expects: {
        throws: new BlackjackGameNotFoundError(validGameId, expect.any(String)),
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { id, seed, hash, seats, exists } = inputs
    const { throws } = expects
    const shouldThrow = throws !== false && typeof throws === 'object'
    const pendingGame: GameState = {
      id,
      seed,
      hash,
      status: GameStatus.Pending,
      players: [
        ...seats.map(
          seat =>
            ({
              playerId: seat.playerId,
              hands: [],
            }) satisfies PlayerSeat,
        ),
        DealerSeatDefault,
      ],
    }

    // Silence logger with a mock
    getMockedLogger()

    gameDoc.BlackjackGameModel.findById = jest
      .fn()
      .mockResolvedValue(pendingGame)
    gameDoc.BlackjackGameModel.updateOne = jest.fn((_f, _d, _o) => ({
      acknowledged: true,
    }))
    jest
      .spyOn(cache, 'set')
      .mockImplementation(async (_n, _k, game, _t) => game)
    jest.spyOn(cache, 'cached').mockResolvedValue(Promise.resolve(pendingGame))
    jest.spyOn(gameDoc, 'gameExists').mockResolvedValue(Promise.resolve(exists))
    jest
      .spyOn(gameDoc, 'getGameById')
      .mockResolvedValue(Promise.resolve(pendingGame))
    jest.spyOn(gameDoc, 'upsertGame').mockImplementation(async game => game)
    jest.spyOn(gameDoc, 'deleteGame').mockImplementation(async _gameId => {})
    jest.spyOn(histDoc, 'recordHistory').mockImplementation(async game => game)

    let game: GameState | undefined
    if (shouldThrow) {
      await expect(gameLib.startGame(id, hash, seats)).rejects.toThrow(throws)
    } else {
      await expect(
        gameLib.startGame(id, hash, seats).then(res => {
          game = res
          return res
        }),
      ).resolves.toBeDefined()
      expect(game!.players).toHaveLength(seats.length + 1)
      // Iterate seats not players, because the dealer is automatically added as the last player in every game.
      for (let seatIndex = 0; seatIndex < seats.length; seatIndex++) {
        const player = game!.players[seatIndex]
        expect(player.playerId).toBe(seats[seatIndex].playerId)
        expect(player.hands).toHaveLength(seats[seatIndex].wagers.length)
        for (let handIndex = 0; handIndex < player.hands.length; handIndex++) {
          const hand = player.hands[handIndex] as PlayerHand
          const handWager = seats[seatIndex].wagers[handIndex]
          const expectedHandIndex =
            'handIndex' in handWager ? handWager.handIndex : 0
          expect(hand.handIndex).toBeGreaterThanOrEqual(expectedHandIndex)
          const expectedWager = {
            type: HandWagerType.Main,
            sides: handWager.sides,
            amount: handWager.amount,
          }
          expect(hand.wager).toEqual(expectedWager)
          expect(hand.cards).toHaveLength(2)
          for (const card of hand.cards) {
            expect(card.hidden).toBe(false)
          }
        }
      }

      // The dealer is always the last player in the game and only plays a single hand.
      const dealer = game!.players[game!.players.length - 1]
      expect(game!.players.filter(isDealerSeat)).toHaveLength(1)
      expect(dealer.playerId).toBe(DEALER_ID)
      expect(dealer.hands).toHaveLength(1)
      expect(dealer.hands[0]!.cards).toHaveLength(2)

      // Make sure the dealer's hole card is hidden unless the game is complete.
      const isHidden = game?.status !== GameStatus.Complete
      expect(dealer.hands[0]!.cards[DEALER_HOLE_INDEX].hidden).toBe(isHidden)

      // Make sure insurance was offered if the dealer showed an Ace.
      if (dealer.hands[0]!.cards[0].value === CardValueType.Ace) {
        for (const hand of game!.players.map(player => player.hands).flat()) {
          expect(hand.status?.canInsure).toBe(true)
        }
      }
    }
  })
})

describe('Get Game', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validGameId = getObjectIdValue()
  const cases = [
    {
      name: 'Gets A Game By ID As Expected',
      inputs: {
        gameId: validGameId,
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs }) => {
    const { gameId } = inputs

    // Mock
    jest
      .spyOn(gameDoc, 'getGameById')
      .mockResolvedValue(Promise.resolve({} as unknown as GameState))

    // Test
    await expect(gameLib.getGame(gameId)).resolves.toBeDefined()

    // Assert
    expect(gameDoc.getGameById).toHaveBeenCalledTimes(1)
    expect(gameDoc.getGameById).toHaveBeenCalledWith(gameId)
  })
})

describe('Post Action Process', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validSeed = utilsLib.getRandomSeed()
  const validHash = generateHmac(validSeed, validSeed)
  const validGameId = getObjectIdValue()
  const cases = [
    {
      name: 'Process A Game Post Action As Expected',
      inputs: {
        game: {
          id: validGameId,
          seed: validSeed,
          hash: validHash,
          status: GameStatus.Active,
          players: [
            {
              playerId: 'test',
              hands: [
                {
                  handIndex: 0,
                  wager: buildBasicMainWager(100),
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Ace,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Nine,
                      hidden: false,
                    },
                  ],
                  status: {
                    value: 20,
                    isHard: false,
                    isSoft: false,
                    isBust: false,
                    isBlackjack: false,
                    canHit: false,
                    canStand: false,
                    canInsure: false,
                    canSplit: false,
                    canDoubleDown: true,
                    splitFrom: null,
                    wasDoubled: false,
                    outcome: HandOutcomeType.Unknown,
                  },
                  actions: [
                    {
                      shoeIndex: 0,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                    {
                      shoeIndex: 1,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
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
                      shoeIndex: 2,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                    {
                      shoeIndex: 3,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                  ],
                  status: {
                    value: 17,
                    isHard: false,
                    isSoft: false,
                    isBust: false,
                    isBlackjack: false,
                    canHit: false,
                    canStand: false,
                    canInsure: false,
                    canSplit: false,
                    canDoubleDown: true,
                    splitFrom: null,
                    wasDoubled: false,
                    outcome: HandOutcomeType.Unknown,
                  },
                },
              ],
            },
          ],
        } satisfies GameState,
      },
      expects: {},
    },
  ]

  it.each(cases)('$name', async ({ inputs }) => {
    const { game } = inputs

    // Mock
    jest.spyOn(dealerLib, 'maybeDealersTurn').mockReturnValue(game)
    jest.spyOn(gameDoc, 'deleteGame').mockImplementation(async _gameId => {})

    // Test
    expect(gameLib.postActionProcess(game)).toBeDefined()

    // Assert
    expect(dealerLib.maybeDealersTurn).toHaveBeenCalledTimes(1)
    expect(dealerLib.maybeDealersTurn).toHaveBeenCalledWith(game)
  })
})

describe('With Active Game', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validSeed = utilsLib.getRandomSeed()
  const validHash = generateHmac(validSeed, validSeed)
  const validGameId = getObjectIdValue()
  const cases = [
    {
      name: 'Runs An Action With An Active Game As Expected',
      inputs: {
        mutexLock: undefined,
        game: {
          id: validGameId,
          seed: validSeed,
          hash: validHash,
          status: GameStatus.Active,
          players: [
            {
              playerId: 'test',
              hands: [
                {
                  handIndex: 0,
                  wager: buildBasicMainWager(100),
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Ace,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Ten,
                      hidden: false,
                    },
                  ],
                  status: HandStatusDefault,
                  actions: [
                    {
                      shoeIndex: 0,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                    {
                      shoeIndex: 1,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
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
                      shoeIndex: 2,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                    {
                      shoeIndex: 3,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            },
          ],
        } satisfies GameState,
      },
      expects: {
        throws: false,
        actionCount: 1,
        upsertCount: 1,
      },
    },
    {
      name: 'Errors Without Mutex Lock As Expected',
      inputs: {
        mutexLock: null,
        game: {
          id: validGameId,
          seed: validSeed,
          hash: validHash,
          status: GameStatus.Active,
          players: [
            {
              playerId: 'test',
              hands: [
                {
                  handIndex: 0,
                  wager: buildBasicMainWager(100),
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Ace,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Ten,
                      hidden: false,
                    },
                  ],
                  status: HandStatusDefault,
                  actions: [
                    {
                      shoeIndex: 0,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                    {
                      shoeIndex: 1,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
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
                      shoeIndex: 2,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                    {
                      shoeIndex: 3,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            },
          ],
        } satisfies GameState,
      },
      expects: {
        throws: new BlackjackMutexError(validGameId, 'game'),
        actionCount: 0,
        upsertCount: 0,
      },
    },
    {
      name: 'Skips Upsert If Action Returns Undefined',
      inputs: {
        mutexLock: undefined,
        actionResult: null,
        game: {
          id: validGameId,
          seed: validSeed,
          hash: validHash,
          status: GameStatus.Active,
          players: [
            {
              playerId: 'test',
              hands: [
                {
                  handIndex: 0,
                  wager: buildBasicMainWager(100),
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Ace,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Ten,
                      hidden: false,
                    },
                  ],
                  status: HandStatusDefault,
                  actions: [
                    {
                      shoeIndex: 0,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                    {
                      shoeIndex: 1,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
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
                      shoeIndex: 2,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                    {
                      shoeIndex: 3,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            },
          ],
        } satisfies GameState,
      },
      expects: {
        throws: false,
        actionCount: 0,
        upsertCount: 0,
      },
    },
    {
      name: 'Throws When Action Throws',
      inputs: {
        mutexLock: undefined,
        actionResult: new Error('Something bad happened'),
        game: {
          id: validGameId,
          seed: validSeed,
          hash: validHash,
          status: GameStatus.Active,
          players: [
            {
              playerId: 'test',
              hands: [
                {
                  handIndex: 0,
                  wager: buildBasicMainWager(100),
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Ace,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Ten,
                      hidden: false,
                    },
                  ],
                  status: HandStatusDefault,
                  actions: [
                    {
                      shoeIndex: 0,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                    {
                      shoeIndex: 1,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
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
                      shoeIndex: 2,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                    {
                      shoeIndex: 3,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                  ],
                  status: HandStatusDefault,
                },
              ],
            },
          ],
        } satisfies GameState,
      },
      expects: {
        throws: new Error('Something bad happened'),
        actionCount: 0,
        upsertCount: 0,
      },
    },
  ]
  it.each(cases)('$name', async ({ inputs, expects }) => {
    let actionCount = 0
    const { game, mutexLock, actionResult } = inputs
    const { throws } = expects
    const action = game => {
      if (actionResult !== undefined) {
        if (actionResult instanceof Error) {
          throw actionResult
        }
        return actionResult
      }

      actionCount++
      return game
    }

    // Mock dealer
    jest.spyOn(dealerLib, 'maybeDealersTurn').mockReturnValue(game)

    // Mock game doc
    gameDoc.BlackjackGameModel.findById = jest.fn().mockResolvedValue({
      game,
      toObject: () => game,
    })
    jest.spyOn(gameDoc, 'getGameById').mockResolvedValue(Promise.resolve(game))
    jest.spyOn(gameDoc, 'upsertGame').mockImplementation(async game => game)
    jest.spyOn(gameDoc, 'deleteGame').mockImplementation(async _gameId => {})

    // Mock mutex
    if (mutexLock !== undefined) {
      ;(MutexLock as any).failNextLock(true)
    }

    // Create a new logger with the silent option set to true
    getMockedLogger()

    // Test
    if (throws !== false && typeof throws === 'object') {
      await expect(gameLib.withActiveGame(game.id, action)).rejects.toThrow(
        throws,
      )
    } else {
      await expect(
        gameLib.withActiveGame(game.id, action),
      ).resolves.toBeDefined()
    }

    // Assert
    expect(actionCount).toBe(expects.actionCount)
    expect(gameDoc.upsertGame).toHaveBeenCalledTimes(expects.upsertCount)
  })
})

describe('Closeout Seat', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validBetId = getObjectIdValue()
  const validGameId = getObjectIdValue()
  const validPlayerId = getObjectIdValue()
  const cases = [
    {
      name: 'Closes Out A Winning Basic Seat As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ace,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
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
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 250,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out A Losing Basic Seat As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ace,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
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
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 0,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out A Busted Basic Seat As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
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
                  value: CardValueType.Ten,
                  hidden: true,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 0,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out A Dealer-Busted Basic Seat As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
          playerId: DEALER_ID,
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: true,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: true,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 200,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out An Insured Seat With Dealer Blackjack As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.Insurance,
                  amount: 50,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
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
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 100,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out An Insured Seat With Blackjack As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.Insurance,
                  amount: 50,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ace,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
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
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 100,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out An Insured Seat Without Blackjack As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.Insurance,
                  amount: 50,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
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
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 200,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out A Seat With Perfect Pair As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.PerfectPair,
                  amount: 100,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
          playerId: DEALER_ID,
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: true,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: true,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 2700,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out A Seat With Perfect Pair Loss As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.PerfectPair,
                  amount: 100,
                  outcome: WagerOutcomeType.Loss,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
          playerId: DEALER_ID,
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: true,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: true,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 200,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out A Seat With Colored Pair As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.PerfectPair,
                  amount: 100,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Spades,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
          playerId: DEALER_ID,
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: true,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: true,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 1400,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out A Seat With Mixed Pair As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.PerfectPair,
                  amount: 100,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Hearts,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
          playerId: DEALER_ID,
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: true,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: true,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 800,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out A Seat With 21+3 Flush As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.TwentyOnePlusThree,
                  amount: 100,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
          playerId: DEALER_ID,
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: true,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 700,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out A Seat With 21+3 Straight As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.TwentyOnePlusThree,
                  amount: 100,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Eight,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
          playerId: DEALER_ID,
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Hearts,
                  value: CardValueType.Ten,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: true,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 1200,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out A Seat With 21+3 Triplets As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.TwentyOnePlusThree,
                  amount: 100,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
          playerId: DEALER_ID,
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Hearts,
                  value: CardValueType.Nine,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: true,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 3200,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out A Seat With 21+3 Straight Flush As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.TwentyOnePlusThree,
                  amount: 100,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Eight,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
          playerId: DEALER_ID,
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: true,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 4200,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Closes Out A Seat With 21+3 Suited Triplets As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: getObjectIdValue(),
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.TwentyOnePlusThree,
                  amount: 100,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
          playerId: DEALER_ID,
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: true,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: false,
        finalPayout: 10200,
        calls: {
          error: { 0: [] },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Throws Without ActiveBet As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: validPlayerId,
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.TwentyOnePlusThree,
                  amount: 100,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
          playerId: DEALER_ID,
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: true,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: new BlackjackNoActiveWagerError(
          validGameId,
          validPlayerId,
          0,
          validBetId,
          'closeOutSeat',
        ),
        finalPayout: 10200,
        calls: {
          error: {
            1: [
              'Blackjack No Active Wager Error',
              {
                betId: validBetId,
                gameId: validGameId,
                handIndex: 0,
                playerId: validPlayerId,
              },
            ],
          },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: { 0: [] },
        },
      },
    },
    {
      name: 'Throws When `prepareAndCloseoutActiveBet` Throws As Expected',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: validPlayerId,
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.TwentyOnePlusThree,
                  amount: 100,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
          playerId: DEALER_ID,
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: true,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
        prepareAndCloseoutActiveBet: new Error('Something bad happened!'),
      },
      expects: {
        throws: new Error('Something bad happened!'),
        finalPayout: 10200,
        calls: {
          error: {
            1: [
              'Unknown Blackjack Error',
              {
                error: {
                  cause: undefined,
                  message: 'Something bad happened!',
                  name: 'Error',
                  stack: expect.any(String),
                },
              },
            ],
          },
          getActiveBetById: { 1: [validBetId] },
          prepareAndCloseoutActiveBet: {
            1: [
              expect.objectContaining({
                id: validBetId,
                gameId: validGameId,
                gameName: BLACKJACK_GAME_NAME,
              }),
            ],
          },
        },
      },
    },
    {
      name: 'Throws When The Dealer Lacks Status',
      inputs: {
        gameId: validGameId,
        player: {
          betId: validBetId,
          playerId: validPlayerId,
          hands: [
            {
              handIndex: 0,
              wager: buildBasicMainWager(100, [
                {
                  type: HandWagerType.TwentyOnePlusThree,
                  amount: 100,
                  outcome: WagerOutcomeType.Win,
                },
              ]),
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 0,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 1,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  type: HandActionType.Stand,
                  timestamp: getTimestamp(),
                },
              ],
              status: HandStatusDefault,
            },
          ],
        } satisfies PlayerSeatWithLiveWager,
        dealer: {
          playerId: DEALER_ID,
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Nine,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Six,
                  hidden: true,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Ten,
                  hidden: false,
                },
              ],
              actions: [
                {
                  shoeIndex: 2,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 3,
                  type: HandActionType.Deal,
                  timestamp: getTimestamp(),
                },
                {
                  shoeIndex: 4,
                  type: HandActionType.Hit,
                  timestamp: getTimestamp(),
                },
              ],
              status: undefined,
            },
          ],
        } satisfies DealerSeat,
        activeBet: {
          id: validBetId,
          gameId: validGameId,
          gameName: BLACKJACK_GAME_NAME,
          playerCount: 1,
          seatIndex: 0,
          handWagers: { 0: buildBasicMainWager(100) },
        } as unknown as ActiveBetWithWagers,
      },
      expects: {
        throws: new BlackjackDealerStatusError(validGameId, expect.any(String)),
        finalPayout: 10200,
        calls: {
          error: {
            1: ['Blackjack Dealer Hand Has No Status', { gameId: validGameId }],
          },
          getActiveBetById: { 0: [] },
          prepareAndCloseoutActiveBet: { 0: [] },
        },
      },
    },
  ].map(testCase => {
    // Update statuses live so we don't have to hand-code all that.
    const { dealer, player } = testCase.inputs
    if (dealer.hands[0].status) {
      dealer.hands[0].status = getHandStatus(dealer.hands[0], dealer.hands[0])
    }
    player.hands = player.hands.map(hand => {
      hand.status = getHandStatus(hand, dealer.hands[0])
      return hand
    })
    return testCase
  })

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { gameId, player, dealer, activeBet, prepareAndCloseoutActiveBet } =
      inputs
    const { finalPayout, throws, calls } = expects
    const closeoutSeat = { gameId, player, dealer }
    let payoutValue: number | undefined

    // Mock a logger
    const logger = getMockedLogger()

    // Mock ActiveBet
    jest
      .spyOn(activeBetDoc, 'getActiveBetById')
      .mockResolvedValue(Promise.resolve(activeBet as unknown as ActiveBet))
    jest
      .spyOn(activeBetDoc, 'prepareAndCloseoutActiveBet')
      .mockImplementation(async activeBet => {
        if (prepareAndCloseoutActiveBet) {
          throw prepareAndCloseoutActiveBet
        }
        payoutValue = activeBet.payoutValue
        return activeBet as unknown as BetHistory
      })

    // Test
    if (throws !== false && typeof throws === 'object') {
      await expect(gameLib.closeOutSeat(closeoutSeat)).rejects.toThrow(throws)
    } else {
      await expect(gameLib.closeOutSeat(closeoutSeat)).resolves.not.toThrow()
      expect(payoutValue).toBeDefined()
      expect(payoutValue).toEqual(finalPayout)
    }

    // Assert
    expect(activeBetDoc.getActiveBetById).toHaveBeenCalledWithNthArgs(
      calls.getActiveBetById,
      'calls.getActiveBetById',
    )
    expect(
      activeBetDoc.prepareAndCloseoutActiveBet,
    ).toHaveBeenCalledWithNthArgs(
      calls.prepareAndCloseoutActiveBet,
      'calls.prepareAndCloseoutActiveBet',
    )
    expect(logger.error).toHaveBeenCalledWithNthArgs(calls.error, 'calls.error')
  })
})

describe('Closeout Game', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validGame = buildBasicDealtGame()
  const cases = [
    {
      name: 'Throws When Status Is Not Complete',
      inputs: {
        game: validGame,
      },
      expects: {
        throws: new BlackjackInvalidCloseoutError(
          validGame.id,
          expect.any(String),
        ),
        calls: {
          error: {
            1: ['Blackjack Invalid Closeout Error', { gameId: validGame.id }],
          },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { game } = inputs
    const { throws, calls } = expects

    // Mock a logger
    const logger = getMockedLogger()

    // Test
    if (typeof throws === 'object') {
      await expect(gameLib.closeoutGame(game)).rejects.toThrow(throws)
    } else {
      await expect(gameLib.closeoutGame(game)).resolves.not.toThrow()
    }

    // Assert
    expect(logger.error).toHaveBeenCalledWithNthArgs(calls.error, 'calls.error')
  })
})

describe('Closeout Seat QA Reproductions', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Closes Out A Winning Seat w/Perfect Pair Loss As Expected',
      inputs: {
        game: {
          id: '65b26ef50fdf032dc3ef27f9',
          status: GameStatus.Complete,
          seed: 'WEnaqI1fkrllMegztUK9pG360DqZ1xWuHpIQrG0icQ3GuMa39W5kmFm05VQI47AN0C4BpJ5n3BlBMagdYtw5H7F9E9pgjhiVlWBaTzGd5qbCRuXsV4gZLo53FNZPvI8tqK2FTUX3pbrl7hy6eiKJFU4nXvMshvFEDi4rP9eXuY9V9NwLlA46Fs9pXeDgZ7vMR8h76ES7wnIbXVtYZqLwn7TnFpyd6lvmxO1TRZiuL9zuT85VCDQtJSuyFPVyn89a',
          hash: 'e549fce843d56745d64cfe60bc2461faef98d35b84185fd276c2fcc260344130',
          players: [
            {
              playerId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
              betId: '9bb107e4-ad4a-45d7-8f3a-094a99b5b017',
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
                      suit: CardSuitType.Diamonds,
                      value: CardValueType.Ace,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Queen,
                      hidden: false,
                    },
                  ],
                  status: {
                    value: 21,
                    isHard: false,
                    isSoft: true,
                    isBust: false,
                    isBlackjack: true,
                    canHit: false,
                    canStand: false,
                    canInsure: false,
                    canSplit: false,
                    canDoubleDown: true,
                    splitFrom: null,
                    wasDoubled: false,
                    outcome: HandOutcomeType.Win,
                  },
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(1706192842966),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(1706192842966),
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
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Three,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Ten,
                      hidden: true,
                    },
                  ],
                  status: {
                    value: 13,
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
                      timestamp: new Date(1706192842967),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(1706192842967),
                      shoeIndex: 3,
                    },
                  ],
                },
              ],
            },
          ],
        } satisfies GameState,
        activeBet: {
          balanceType: 'eth',
          betAmount: 200,
          closedOut: false,
          gameId: '65b26ef50fdf032dc3ef27f9',
          gameName: BLACKJACK_GAME_NAME,
          highroller: false,
          id: '9bb107e4-ad4a-45d7-8f3a-094a99b5b017',
          incognito: false,
          timestamp: new Date(1706192841966),
          userId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
          playerCount: 1,
          seatIndex: 0,
          handWagers: {
            0: {
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
          },
        } satisfies ActiveBet & ActiveBetWithWagers,
        betHistory: {
          balanceType: 'eth',
          betAmount: 200,
          betId: '9bb107e4-ad4a-45d7-8f3a-094a99b5b017',
          closedOut: false,
          gameId: '65b26ef50fdf032dc3ef27f9',
          gameName: BLACKJACK_GAME_NAME,
          highroller: false,
          incognito: false,
          timestamp: new Date(1706192841966),
          userId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
        } satisfies BetHistory,
      },
      expects: {
        finalPayout: 250,
      },
    },
    {
      name: 'Closes Out A Winning Seat w/21+3 As Expected',
      inputs: {
        game: {
          id: '65b26ef50fdf032dc3ef27f9',
          status: GameStatus.Complete,
          seed: 'WEnaqI1fkrllMegztUK9pG360DqZ1xWuHpIQrG0icQ3GuMa39W5kmFm05VQI47AN0C4BpJ5n3BlBMagdYtw5H7F9E9pgjhiVlWBaTzGd5qbCRuXsV4gZLo53FNZPvI8tqK2FTUX3pbrl7hy6eiKJFU4nXvMshvFEDi4rP9eXuY9V9NwLlA46Fs9pXeDgZ7vMR8h76ES7wnIbXVtYZqLwn7TnFpyd6lvmxO1TRZiuL9zuT85VCDQtJSuyFPVyn89a',
          hash: 'e549fce843d56745d64cfe60bc2461faef98d35b84185fd276c2fcc260344130',
          players: [
            {
              playerId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
              betId: '9bb107e4-ad4a-45d7-8f3a-094a99b5b017',
              hands: [
                {
                  handIndex: 0,
                  wager: {
                    type: HandWagerType.Main,
                    amount: 100,
                    sides: [
                      {
                        type: HandWagerType.TwentyOnePlusThree,
                        amount: 100,
                        outcome: WagerOutcomeType.Win,
                      },
                    ],
                  },
                  cards: [
                    {
                      suit: CardSuitType.Diamonds,
                      value: CardValueType.Ace,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Queen,
                      hidden: false,
                    },
                  ],
                  status: {
                    value: 21,
                    isHard: false,
                    isSoft: true,
                    isBust: false,
                    isBlackjack: true,
                    canHit: false,
                    canStand: false,
                    canInsure: false,
                    canSplit: false,
                    canDoubleDown: true,
                    splitFrom: null,
                    wasDoubled: false,
                    outcome: HandOutcomeType.Win,
                  },
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(1706192842966),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(1706192842966),
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
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.King,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Jack,
                      hidden: true,
                    },
                  ],
                  status: {
                    value: 13,
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
                      timestamp: new Date(1706192842967),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(1706192842967),
                      shoeIndex: 3,
                    },
                  ],
                },
              ],
            },
          ],
        } satisfies GameState,
        activeBet: {
          balanceType: 'eth',
          betAmount: 200,
          closedOut: false,
          gameId: '65b26ef50fdf032dc3ef27f9',
          gameName: BLACKJACK_GAME_NAME,
          highroller: false,
          id: '9bb107e4-ad4a-45d7-8f3a-094a99b5b017',
          incognito: false,
          timestamp: new Date(1706192841966),
          userId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
          playerCount: 1,
          seatIndex: 0,
          handWagers: {
            0: {
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
          },
        } satisfies ActiveBet & ActiveBetWithWagers,
        betHistory: {
          balanceType: 'eth',
          betAmount: 200,
          betId: '9bb107e4-ad4a-45d7-8f3a-094a99b5b017',
          closedOut: false,
          gameId: '65b26ef50fdf032dc3ef27f9',
          gameName: BLACKJACK_GAME_NAME,
          highroller: false,
          incognito: false,
          timestamp: new Date(1706192841966),
          userId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
        } satisfies BetHistory,
      },
      expects: {
        finalPayout: 1250,
      },
    },
    {
      name: 'Closes Out A Loosing Seat w/Mixed Pair Loss As Expected',
      inputs: {
        game: {
          id: '65c6390c444e0b213b230962',
          status: GameStatus.Complete,
          seed: 'kMZs8fu6AkiVKyU12dIW1HQTCgpfVzCMvQQTzdpSJ4EWufZCQ4Mub2CbSyCC5zrmFJmjlrxgOtDcw5ZLzfFS3FZaSdwnYPzXhtchddIOYbtXIf3x5SiPiisDRolzpkUvE5hKgJYJZDR8OpjMpL4lWLleeJAEoLtzNkoj0jYaKzi1DUBtKETdx8qh2dCLbXBGPeR7ElBDudIcF4QwuKU6vHkKs2w5WOUClFBzLrfpibjrBLq9KmBM0lpCiH98F4sx',
          hash: '8dfc9b39c09d8b993eff6e4ecdfac933271f745bec0cec26b5ec879fb0d92969',
          players: [
            {
              playerId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
              betId: '879715ad-11d4-4bf1-8841-780940a61c91',
              hands: [
                {
                  handIndex: 0,
                  wager: {
                    type: HandWagerType.Main,
                    amount: 100,
                    sides: [
                      {
                        type: HandWagerType.PerfectPair,
                        amount: 30,
                        outcome: WagerOutcomeType.Loss,
                      },
                    ],
                  },
                  cards: [
                    {
                      suit: CardSuitType.Diamonds,
                      value: CardValueType.Three,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Three,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Spades,
                      value: CardValueType.Ten,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Diamonds,
                      value: CardValueType.King,
                      hidden: false,
                    },
                  ],
                  status: {
                    value: 26,
                    isHard: false,
                    isSoft: false,
                    isBust: true,
                    isBlackjack: false,
                    canHit: false,
                    canStand: false,
                    canInsure: false,
                    canSplit: false,
                    canDoubleDown: false,
                    splitFrom: null,
                    wasDoubled: false,
                    outcome: HandOutcomeType.Loss,
                  },
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(1707489554531),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(1707489554531),
                      shoeIndex: 1,
                    },
                    {
                      type: HandActionType.Hit,
                      timestamp: new Date(1707489562669),
                      shoeIndex: 4,
                    },
                    {
                      type: HandActionType.Hit,
                      timestamp: new Date(1707489570324),
                      shoeIndex: 5,
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
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Ten,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Spades,
                      value: CardValueType.Ten,
                      hidden: false,
                    },
                  ],
                  status: {
                    value: 20,
                    isHard: true,
                    isSoft: false,
                    isBust: false,
                    isBlackjack: false,
                    canHit: false,
                    canStand: false,
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
                      timestamp: new Date(1707489554531),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(1707489554531),
                      shoeIndex: 3,
                    },
                    {
                      type: HandActionType.Stand,
                      timestamp: new Date(1707489562669),
                    },
                  ],
                },
              ],
            },
          ],
        } satisfies GameState,
        activeBet: {
          balanceType: 'eth',
          betAmount: 130,
          closedOut: false,
          gameId: '65c6390c444e0b213b230962',
          gameName: BLACKJACK_GAME_NAME,
          highroller: false,
          id: '879715ad-11d4-4bf1-8841-780940a61c91',
          incognito: false,
          timestamp: new Date(1706192841966),
          userId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
          playerCount: 1,
          seatIndex: 0,
          handWagers: {
            0: {
              type: HandWagerType.Main,
              amount: 100,
              sides: [
                {
                  type: HandWagerType.PerfectPair,
                  amount: 30,
                  outcome: WagerOutcomeType.Win,
                },
              ],
            },
          },
        } satisfies ActiveBet & ActiveBetWithWagers,
        betHistory: {
          balanceType: 'eth',
          betAmount: 130,
          betId: '879715ad-11d4-4bf1-8841-780940a61c91',
          closedOut: false,
          gameId: '65c6390c444e0b213b230962',
          gameName: BLACKJACK_GAME_NAME,
          highroller: false,
          incognito: false,
          timestamp: new Date(1707489554520),
          userId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
        } satisfies BetHistory,
      },
      expects: {
        finalPayout: 180,
      },
    },
    {
      name: 'Closes Out A Loosing Seat w/Perfect Pair Win As Expected',
      inputs: {
        game: {
          id: '65c657c7c3d53377b868f1fd',
          status: GameStatus.Complete,
          seed: '2zYOYRwyKV5quGyn5LU9hDVHQ8zsYiNE4SFN495C71wi0hU4yGgtccaKotiT0w3KPwZoGwVID2l2MzAZxemTfYEMFMIWvfazSZuXMrdtQtP1rhVvqEIdJzXa0EXWr5PPCdMilpkrQQEVycMWXlSbCbk2yHxWQbQ2YE74k8Utkv1VWu3yyk1wzQt73m4Lg92ZIIkHnYG8AVWfN9yqG8HiwdefYGPX6v2XbjiwPH7EOE0RqJg2szSUjzYDEr2KBrdi',
          hash: 'e8e9c3800066fb73daade90f5ddb5a457a7fa57e8262867af0bf097c9514cfb5',
          players: [
            {
              playerId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
              betId: 'af023bb2-e8ce-44ad-8ba7-2140c7a684b0',
              hands: [
                {
                  handIndex: 0,
                  wager: {
                    type: HandWagerType.Main,
                    amount: 100,
                    sides: [
                      {
                        type: HandWagerType.PerfectPair,
                        amount: 30,
                        outcome: WagerOutcomeType.Win,
                      },
                    ],
                  },
                  cards: [
                    {
                      suit: CardSuitType.Spades,
                      value: CardValueType.Seven,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Diamonds,
                      value: CardValueType.Seven,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.King,
                      hidden: false,
                    },
                  ],
                  status: {
                    value: 24,
                    isHard: false,
                    isSoft: false,
                    isBust: true,
                    isBlackjack: false,
                    canHit: false,
                    canStand: false,
                    canInsure: false,
                    canSplit: false,
                    canDoubleDown: false,
                    splitFrom: null,
                    wasDoubled: false,
                    outcome: HandOutcomeType.Loss,
                  },
                  actions: [
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(1707497419868),
                      shoeIndex: 0,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(1707497419868),
                      shoeIndex: 1,
                    },
                    {
                      type: HandActionType.Hit,
                      timestamp: new Date(1707497427873),
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
                      value: CardValueType.Eight,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.King,
                      hidden: false,
                    },
                  ],
                  status: {
                    value: 18,
                    isHard: true,
                    isSoft: false,
                    isBust: false,
                    isBlackjack: false,
                    canHit: false,
                    canStand: false,
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
                      timestamp: new Date(1707497419868),
                      shoeIndex: 2,
                    },
                    {
                      type: HandActionType.Deal,
                      timestamp: new Date(1707497419868),
                      shoeIndex: 3,
                    },
                    {
                      type: HandActionType.Stand,
                      timestamp: new Date(1707497427873),
                    },
                  ],
                },
              ],
            },
          ],
        } satisfies GameState,
        activeBet: {
          balanceType: 'eth',
          betAmount: 130,
          closedOut: false,
          gameId: '65c657c7c3d53377b868f1fd',
          gameName: BLACKJACK_GAME_NAME,
          highroller: false,
          id: 'af023bb2-e8ce-44ad-8ba7-2140c7a684b0',
          incognito: false,
          timestamp: new Date(1706192841966),
          userId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
          playerCount: 1,
          seatIndex: 0,
          handWagers: {
            0: {
              type: HandWagerType.Main,
              amount: 100,
              sides: [
                {
                  type: HandWagerType.PerfectPair,
                  amount: 30,
                  outcome: WagerOutcomeType.Win,
                },
              ],
            },
          },
        } satisfies ActiveBet & ActiveBetWithWagers,
        betHistory: {
          balanceType: 'eth',
          betAmount: 130,
          betId: 'af023bb2-e8ce-44ad-8ba7-2140c7a684b0',
          closedOut: false,
          gameId: '65c657c7c3d53377b868f1fd',
          gameName: BLACKJACK_GAME_NAME,
          highroller: false,
          incognito: false,
          timestamp: new Date(1707497419850),
          userId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
        } satisfies BetHistory,
      },
      expects: {
        finalPayout: 180,
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { game, activeBet, betHistory } = inputs
    const { finalPayout } = expects
    const closeoutSeat = {
      gameId: game.id,
      player: game.players[0],
      dealer: game.players[1],
    } satisfies PlayerSeatCloseOut
    let payoutValue: number | undefined

    // Mock ActiveBet
    jest
      .spyOn(activeBetDoc, 'getActiveBetById')
      .mockResolvedValue(Promise.resolve(activeBet))
    jest
      .spyOn(activeBetDoc, 'prepareAndCloseoutActiveBet')
      .mockImplementation(async activeBet => {
        payoutValue = activeBet.payoutValue
        return betHistory
      })

    // Suppress logs with mock
    getMockedLogger()

    // Test & Assert
    await expect(gameLib.closeOutSeat(closeoutSeat)).resolves.not.toThrow()
    expect(payoutValue).toBeDefined()
    expect(payoutValue).toEqual(finalPayout)
  })
})

describe('Get Player Games', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const { game, playerId } = buildBasicDealtGameWithPlayerId()
  const cases = [
    {
      name: 'Gets Games For Player As Expected',
      inputs: {
        playerId,
        games: [game],
      },
      expects: {
        gameCount: 1,
        games: [game],
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { playerId, games } = inputs
    const { gameCount, games: expectedGames } = expects

    // Mock the model to return as expected
    jest
      .spyOn(gameDoc, 'getGamesForPlayer')
      .mockReturnValue(Promise.resolve(games))

    // Suppress logs
    getMockedLogger()

    const result = await gameLib.getPlayerGames(playerId)

    expect(result).toHaveLength(gameCount)
    expect(result).toStrictEqual(expectedGames)
  })
})
