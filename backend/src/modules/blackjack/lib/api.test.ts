import * as betsLib from '../../bet'
import { type ActiveBet } from '../../bet/types'
import * as roundLib from '../../game/lib/round'
import { type User } from '../../user/types'
import '../test/extensions'
import {
  buildBasicDealtGameWithPlayerId,
  buildBasicMainWagers,
  getMockedLogger,
  getObjectIdValue,
} from '../test/utils'
import {
  BLACKJACK_GAME_NAME,
  BlackjackAggregateError,
  BlackjackGameNotFoundError,
  BlackjackMissingRoundIdError,
  ClientGameState,
  DealerSeatDefault,
  GameStatus,
  HandStatusDefault,
  HandWagerType,
  type GameState,
  type PlayerSeat,
  type Table,
  type UserSeatRequest,
} from '../types'
import { getRandomSeed } from '../utils/seed'
import { createUserGame, getUserGames, startUserGame } from './api'
import * as gameLib from './game'

/**
 * The valid `ClientGameState` keys. to ensure only the expected keys are available from the API.
 */
const clientGameKeys = (() => {
  type ClientGameStateProperties = keyof typeof ClientGameState.prototype
  const propertyNames: ClientGameStateProperties[] = ['id', 'status', 'players']
  return propertyNames
})()

describe('Create User Game', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const userId = getObjectIdValue()
  const cases = [
    {
      name: 'Creates A User Game As Expected',
      inputs: {
        user: { id: userId } as unknown as User,
        game: {
          id: getObjectIdValue(),
          status: GameStatus.Pending,
          players: [{ playerId: userId, hands: [{}] }, DealerSeatDefault],
        } as unknown as GameState,
      },
      expects: {
        throws: false,
        calls: {
          createGame: { 1: [expect.any(String), userId] },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { user, game } = inputs
    const { throws, calls } = expects

    // Mock
    jest.spyOn(gameLib, 'createGame').mockResolvedValue(game)

    // Test
    if (throws !== false && typeof throws === 'object') {
      await expect(createUserGame(user)).rejects.toThrow(throws)
    } else {
      let clientGame: ClientGameState | undefined
      await expect(
        createUserGame(inputs.user).then(newGame => {
          clientGame = newGame
        }),
      ).resolves.not.toThrow()
      expect(clientGame).toBeDefined()
      expect(clientGame).toBeInstanceOf(ClientGameState)
      expect(Object.keys(clientGame!)).toEqual(clientGameKeys)
    }

    // Assert
    expect(gameLib.createGame).toHaveBeenCalledWithNthArgs(
      calls.createGame,
      'gameLib.createGame',
    )
  })
})

describe('Start User Game', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const logScope = 'api'
  const userId = getObjectIdValue()
  const userId2 = getObjectIdValue()
  const dbGameId = getObjectIdValue()
  const dbRoundId = getObjectIdValue()
  const roundIds = { _id: dbRoundId, id: dbRoundId }
  const cases = [
    {
      name: 'Starts A Pending Demo Game As Expected',
      inputs: {
        gameId: dbGameId,
        seed: getRandomSeed(),
        requests: [
          { user: { id: userId }, wagers: buildBasicMainWagers([0.5]) },
          { user: { id: userId2 }, wagers: buildBasicMainWagers([0.5]) },
        ] as UserSeatRequest[],
        provablyFairInfo: {
          newRound: true,
          clientSeed: 'clientSeed',
          roundStartInfo: {},
          currentRound: { ...roundIds, hash: getRandomSeed(), nonce: 0 },
        },
      },
      expects: {
        throws: false,
        calls: {
          gameExists: { 1: [dbGameId, GameStatus.Pending] },
          startNewRound: { 2: [expect.any(Object), BLACKJACK_GAME_NAME] },
          getGame: { 1: [dbGameId] },
          startGame: { 1: [dbGameId, expect.any(String), expect.any(Array)] },
          placeBet: { 0: [] },
          refundBet: { 0: [] },
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Starts A Pending Live Game As Expected',
      inputs: {
        gameId: dbGameId,
        seed: getRandomSeed(),
        requests: [
          { user: { id: userId }, wagers: buildBasicMainWagers([1]) },
          { user: { id: userId2 }, wagers: buildBasicMainWagers([1]) },
        ] as UserSeatRequest[],
        provablyFairInfo: {
          newRound: true,
          clientSeed: 'clientSeed',
          roundStartInfo: {},
          currentRound: { ...roundIds, hash: getRandomSeed(), nonce: 0 },
        },
      },
      expects: {
        throws: false,
        calls: {
          gameExists: { 1: [dbGameId, GameStatus.Pending] },
          startNewRound: { 2: [expect.any(Object), BLACKJACK_GAME_NAME] },
          getGame: { 1: [dbGameId] },
          startGame: { 1: [dbGameId, expect.any(String), expect.any(Array)] },
          placeBet: { 1: [expect.any(Object)] },
          refundBet: { 0: [] },
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Errors With Non-Existent Game As Expected',
      inputs: {
        gameId: dbGameId,
        seed: getRandomSeed(),
        gameExists: false,
        requests: [
          {
            user: { id: userId },
            wagers: buildBasicMainWagers([0.5]),
          } satisfies UserSeatRequest,
        ],
        provablyFairInfo: {
          newRound: true,
          clientSeed: 'clientSeed',
          roundStartInfo: {},
          currentRound: { ...roundIds, hash: getRandomSeed(), nonce: 0 },
        },
      },
      expects: {
        throws: new BlackjackGameNotFoundError(dbGameId, logScope),
        calls: {
          gameExists: { 1: [dbGameId, GameStatus.Pending] },
          startNewRound: { 0: [] },
          getGame: { 0: [] },
          startGame: { 0: [] },
          placeBet: { 0: [] },
          refundBet: { 0: [] },
          logError: {
            1: ['Blackjack Game Not Found', { gameId: dbGameId }],
          },
        },
      },
    },
    {
      name: 'Errors With Undefined Round Id As Expected',
      inputs: {
        gameId: dbGameId,
        seed: getRandomSeed(),
        gameExists: true,
        requests: [
          {
            user: { id: userId },
            wagers: buildBasicMainWagers([0.5]),
          } satisfies UserSeatRequest,
        ],
        provablyFairInfo: {
          newRound: true,
          clientSeed: 'clientSeed',
          roundStartInfo: {},
          currentRound: {
            ...roundIds,
            id: undefined,
            hash: getRandomSeed(),
            nonce: 0,
          },
        },
      },
      expects: {
        throws: new BlackjackMissingRoundIdError(dbGameId, logScope),
        calls: {
          gameExists: { 1: [dbGameId, GameStatus.Pending] },
          startNewRound: { 1: [expect.any(Object), BLACKJACK_GAME_NAME] },
          getGame: { 0: [] },
          startGame: { 0: [] },
          placeBet: { 0: [] },
          refundBet: { 0: [] },
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Errors With Rejected Bet As Expected',
      inputs: {
        gameId: dbGameId,
        seed: getRandomSeed(),
        gameExists: true,
        acceptBet: false,
        requests: [
          {
            user: { id: userId },
            wagers: buildBasicMainWagers([0.5]),
          } satisfies UserSeatRequest,
          {
            user: { id: userId2 },
            wagers: buildBasicMainWagers([0.5]),
          } satisfies UserSeatRequest,
        ],
        provablyFairInfo: {
          newRound: true,
          clientSeed: 'clientSeed',
          roundStartInfo: {},
          currentRound: { ...roundIds, hash: getRandomSeed(), nonce: 0 },
        },
      },
      expects: {
        throws: new BlackjackAggregateError(
          dbGameId,
          expect.any(String),
          expect.any(Array<Error>()),
        ),
        calls: {
          gameExists: { 1: [dbGameId, GameStatus.Pending] },
          startNewRound: { 2: [expect.any(Object), BLACKJACK_GAME_NAME] },
          getGame: { 1: [dbGameId] },
          startGame: { 0: [] },
          placeBet: { 2: [expect.any(Object)] },
          refundBet: { 1: [expect.any(Object), BLACKJACK_GAME_NAME] },
          logError: {
            1: [
              'Blackjack Aggregate Error',
              {
                errors: [
                  {
                    context: undefined,
                    message: 'bet__not_enough_balance',
                    stack: expect.any(String),
                  },
                ],
                gameId: dbGameId,
              },
            ],
          },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { gameId, requests, provablyFairInfo, seed, gameExists, acceptBet } =
      inputs
    const { throws, calls } = expects
    const logger = getMockedLogger()
    const players: Table = [
      ...requests.map(
        req =>
          ({
            playerId: req.user.id,
            hands: [
              {
                handIndex: 0,
                wager: {
                  type: HandWagerType.Main,
                  amount: 100,
                  sides: [],
                },
                status: HandStatusDefault,
                actions: [],
                cards: [],
              },
            ],
          }) satisfies PlayerSeat,
      ),
      DealerSeatDefault,
    ]

    // Mock
    jest
      .spyOn(betsLib, 'placeBet')
      .mockImplementation(
        async args =>
          ({ ...args, id: getObjectIdValue() }) as unknown as ActiveBet,
      )
    if (acceptBet === false) {
      jest
        .spyOn(betsLib, 'placeBet')
        .mockRejectedValueOnce(new Error('bet__not_enough_balance'))
    }
    jest.spyOn(betsLib, 'refundBet').mockResolvedValue()
    jest
      .spyOn(roundLib, 'startNewRound')
      .mockResolvedValue({ provablyFairInfo, hash: '' })
    jest.spyOn(gameLib, 'gameExists').mockResolvedValue(gameExists ?? true)
    jest.spyOn(gameLib, 'getGame').mockResolvedValue({
      id: gameId,
      seed,
      players,
      status: GameStatus.Pending,
    } satisfies GameState)
    jest.spyOn(gameLib, 'startGame').mockResolvedValue({
      id: gameId,
      seed,
      players,
      status: GameStatus.Pending,
    } satisfies GameState)

    // Test
    if (throws !== false && typeof throws === 'object') {
      await expect(startUserGame(gameId, requests)).rejects.toThrow(throws)
    } else {
      let clientGame: ClientGameState | undefined
      await expect(
        startUserGame(gameId, requests)
          .then(newGame => {
            clientGame = newGame
          })
          .catch(err => {
            console.error(`${err.message} ${err.stack}`)
            throw err
          }),
      ).resolves.not.toThrow()
      expect(clientGame).toBeDefined()
      expect(clientGame).toBeInstanceOf(ClientGameState)
      expect(Object.keys(clientGame!)).toEqual(clientGameKeys)
    }

    // Assert
    expect(gameLib.gameExists).toHaveBeenCalledWithNthArgs(
      calls.gameExists,
      'gameLib.gameExists',
    )
    expect(roundLib.startNewRound).toHaveBeenCalledWithNthArgs(
      calls.startNewRound,
      'roundLib.startNewRound',
    )
    expect(gameLib.getGame).toHaveBeenCalledWithNthArgs(
      calls.getGame,
      'gameLib.getGame',
    )
    expect(gameLib.startGame).toHaveBeenCalledWithNthArgs(
      calls.startGame,
      'gameLib.startGame',
    )
    expect(betsLib.refundBet).toHaveBeenCalledWithNthArgs(
      calls.refundBet,
      'betsLib.refundBet',
    )
    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logError,
      'logger.error',
    )
  })
})

describe('Get User Games', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const { game, playerId } = buildBasicDealtGameWithPlayerId()
  const cases = [
    {
      name: 'Gets Games For User As Expected',
      inputs: {
        user: { id: playerId } as unknown as User,
        games: [game],
      },
      expects: {
        gameCount: 1,
        games: [game].map(game => ClientGameState.fromGameState(game)),
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { user, games } = inputs
    const { gameCount, games: expectedGames } = expects

    // Mock the model to return as expected
    jest
      .spyOn(gameLib, 'getPlayerGames')
      .mockReturnValue(Promise.resolve(games))

    // Suppress logs with mock
    getMockedLogger()

    const result = await getUserGames(user)

    expect(result).toHaveLength(gameCount)
    expect(result).toStrictEqual(expectedGames)
  })
})
