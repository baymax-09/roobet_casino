import { type Document, type FlatRecord, type Types } from 'mongoose'
import * as cacheLib from '../../../util/redisModels/basicCache'
import '../test/extensions'
import {
  buildBasicDealtGameWithPlayerId,
  buildBasicMainWager,
  getMockedLogger,
  getObjectIdValue,
} from '../test/utils'
import {
  BlackjackAggregateError,
  BlackjackGameNotFoundError,
  BlackjackMissingGameHashError,
  BlackjackMissingPlayerHandError,
  BlackjackUpsertFailedError,
  DealerSeatDefault,
  GameStatus,
  HandStatusDefault,
  type GameState,
  type PlayerSeat,
  type Table,
} from '../types'
import { getRandomSeed } from '../utils'
import * as gameDoc from './blackjackGames'
import { toObjectOptions, type DBBlackjackGame } from './blackjackSchemas'

// Enables running the `toObject` transformer on the game object
type GameDocType = Document<unknown, unknown, FlatRecord<DBBlackjackGame>> &
  FlatRecord<DBBlackjackGame> & { _id: Types.ObjectId }
const transformerRef = (game: GameState) => () => {
  if (typeof toObjectOptions.transform === 'function') {
    return toObjectOptions.transform(game as GameDocType, game, toObjectOptions)
  }
  return game
}

describe('Create Game', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Creates A Game As Expected',
      inputs: {
        seed: getRandomSeed(),
        player: { playerId: '5e496bed-678a-422f-bf04-1714180b666e', hands: [] },
      },
      expects: {
        throws: false,
        error: BlackjackAggregateError,
        calls: {
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Error Creating Game Without Players',
      inputs: {
        seed: getRandomSeed(),
        player: undefined as unknown as PlayerSeat,
      },
      expects: {
        throws: true,
        error: BlackjackAggregateError,
        calls: {
          logError: {
            1: [
              'Blackjack Aggregate Error',
              {
                gameId: expect.any(String),
                errors: [
                  {
                    context: {},
                    message: 'Blackjack No Players',
                    stack: expect.any(String),
                  },
                ],
              },
            ],
          },
        },
      },
    },
    {
      name: 'Error Creating Game Without Seed',
      inputs: {
        seed: undefined as unknown as string,
        player: { playerId: '5e496bed-678a-422f-bf04-1714180b666e', hands: [] },
      },
      expects: {
        throws: true,
        error: BlackjackAggregateError,
        calls: {
          logError: {
            1: [
              'Blackjack Aggregate Error',
              {
                gameId: expect.any(String),
                errors: [
                  {
                    context: expect.any(Object),
                    message: 'Blackjack Missing Game Seed Error',
                    stack: expect.any(String),
                  },
                ],
              },
            ],
          },
        },
      },
    },
    {
      name: 'Error Creating Game Without Hash Or Players',
      inputs: {
        seed: undefined as unknown as string,
        player: undefined as unknown as PlayerSeat,
      },
      expects: {
        throws: true,
        error: BlackjackAggregateError,
        calls: {
          logError: {
            1: [
              'Blackjack Aggregate Error',
              {
                gameId: expect.any(String),
                errors: [
                  {
                    context: {},
                    message: 'Blackjack Missing Game Seed Error',
                    stack: expect.any(String),
                  },
                  {
                    context: {},
                    message: 'Blackjack No Players',
                    stack: expect.any(String),
                  },
                ],
              },
            ],
          },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { seed, player } = inputs
    const { throws, error, calls } = expects

    // Create a new logger with the silent option set to true
    const logger = getMockedLogger()

    // Mock the `BlackjackGameModel.create` function to return as expected
    gameDoc.BlackjackGameModel.create = jest.fn(async game =>
      Promise.resolve({
        ...game,
        toObject: transformerRef(game),
      }),
    )

    if (throws) {
      await expect(gameDoc.createGame(seed, player)).rejects.toThrow(error)
    } else {
      await expect(gameDoc.createGame(seed, player)).resolves.not.toThrow()
    }

    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logError,
      'logger.error',
    )
  })
})

describe('Start Game', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validGameId = getObjectIdValue()
  const cases = [
    {
      name: 'Starts A Game As Expected',
      inputs: {
        id: validGameId,
        seed: getRandomSeed(),
        players: [
          {
            playerId: 'test',
            hands: [
              {
                handIndex: 0,
                cards: [],
                actions: [],
                wager: buildBasicMainWager(0),
                status: HandStatusDefault,
              },
            ],
          },
          DealerSeatDefault,
        ] satisfies Table,
      },
      expects: {
        throws: false,
      },
    },
    {
      name: 'Errors Starting A Game Without Hash As Expected',
      inputs: {
        id: validGameId,
        seed: '',
        players: [
          {
            playerId: 'test',
            hands: [
              {
                handIndex: 0,
                cards: [],
                actions: [],
                wager: buildBasicMainWager(0),
                status: HandStatusDefault,
              },
            ],
          },
          DealerSeatDefault,
        ] satisfies Table,
      },
      expects: {
        throws: new BlackjackAggregateError(validGameId, expect.any(String), [
          new BlackjackMissingGameHashError(validGameId, expect.any(String)),
        ]),
      },
    },
    {
      name: 'Errors Starting A Game Without Player Hands As Expected',
      inputs: {
        id: validGameId,
        seed: '',
        players: [
          { playerId: 'test', hands: [] } satisfies PlayerSeat,
          DealerSeatDefault,
        ] as Table,
      },
      expects: {
        throws: new BlackjackAggregateError(validGameId, expect.any(String), [
          new BlackjackMissingPlayerHandError(validGameId, expect.any(String)),
        ]),
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { id, seed, players } = inputs
    const { throws } = expects
    const validGame: GameState = {
      id,
      seed,
      hash: '',
      players,
      status: GameStatus.Pending,
    }

    // Create a new logger with the silent option set to true
    getMockedLogger()

    // Mock the `cached` and `set` functions
    jest.spyOn(cacheLib, 'cached').mockResolvedValue(Promise.resolve(validGame))
    jest.spyOn(cacheLib, 'set').mockResolvedValue(Promise.resolve())

    // Mock the `BlackjackGameModel.updateOne` function to return as expected
    gameDoc.BlackjackGameModel.updateOne = jest.fn(
      async (_filter, _update, _options) =>
        Promise.resolve({
          acknowledged: true,
          matchedCount: 1,
          modifiedCount: 1,
        }),
    )

    if (throws !== false && typeof throws === 'object') {
      await expect(gameDoc.startGame(id, seed, players)).rejects.toThrow(throws)
    } else {
      await expect(gameDoc.startGame(id, seed, players)).resolves.toBeDefined()
    }
  })
})

describe('Get Game By Id', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validGameId = '2a50d4d9-c1e7-4771-84ac-bbcb36291be1'
  const invalidGameId = '01a68439-da5c-48bb-aedb-448ac9c30d17'
  const validGameSeed = getRandomSeed()

  const cases = [
    {
      name: 'Gets A Game By ID From Cache As Expected',
      inputs: {
        gameId: validGameId,
        action: async state => state,
        seats: [
          { playerId: 'playerId', hands: [{}], wagers: [1] },
          DealerSeatDefault,
        ],
        cache: {
          hit: true,
        },
        findById: {
          useValid: false,
        },
      },
      expects: {
        throws: false,
        calls: {
          cached: {
            1: [
              'blackjack',
              `game_${validGameId}`,
              gameDoc.GameCacheSeconds,
              expect.any(Function),
            ],
          },
          findById: { 0: [] },
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Gets A Game By ID From DB As Expected',
      inputs: {
        gameId: validGameId,
        action: async state => state,
        seats: [
          { playerId: 'playerId', hands: [{}], wagers: [1] },
          DealerSeatDefault,
        ],
        cache: {
          hit: false,
        },
        findById: {
          useValid: true,
        },
      },
      expects: {
        throws: false,
        calls: {
          cached: {
            1: [
              'blackjack',
              `game_${validGameId}`,
              gameDoc.GameCacheSeconds,
              expect.any(Function),
            ],
          },
          findById: { 1: [validGameId] },
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Errors As Expected When Game Not Found',
      inputs: {
        gameId: invalidGameId,
        action: async state => state,
        seats: [
          { playerId: 'playerId', hands: [{}], wagers: [1] },
          DealerSeatDefault,
        ],
        cache: {
          hit: false,
        },
        findById: {
          useValid: false,
        },
      },
      expects: {
        throws: new BlackjackGameNotFoundError(
          invalidGameId,
          expect.any(String),
        ),
        calls: {
          cached: {
            1: [
              'blackjack',
              `game_${invalidGameId}`,
              gameDoc.GameCacheSeconds,
              expect.any(Function),
            ],
          },
          findById: { 1: [invalidGameId] },
          logError: { 0: [] },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { gameId, cache, seats } = inputs
    const { throws, calls } = expects
    const validGame: GameState = {
      id: gameId,
      hash: '',
      seed: validGameSeed,
      players: seats as Table,
      status: GameStatus.Active,
    }

    // Create a new logger with the silent option set to true
    const logger = getMockedLogger()

    // Mock the cached function for cache-miss and exec `action` directly
    jest
      .spyOn(cacheLib, 'cached')
      .mockImplementation(async (_name, _key, _exp, action) => {
        return cache.hit ? validGame : await action()
      })

    // Mock the `BlackjackGameModel.findOne` function to return as expected
    if (inputs.findById.useValid === false) {
      gameDoc.BlackjackGameModel.findById = jest
        .fn()
        .mockResolvedValue(undefined)
    } else {
      gameDoc.BlackjackGameModel.findById = jest.fn().mockResolvedValue({
        validGame,
        toObject: () => validGame,
      })
    }

    if (throws !== false && typeof throws === 'object') {
      await expect(gameDoc.getGameById(gameId)).rejects.toThrow(throws)
    } else {
      await expect(gameDoc.getGameById(gameId)).resolves.toBeDefined()
    }

    expect(cacheLib.cached).toHaveBeenCalledWithNthArgs(
      calls.cached,
      'cacheLib.cached',
    )
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(gameDoc.BlackjackGameModel.findById).toHaveBeenCalledWithNthArgs(
      calls.findById,
      'gameDoc.BlackjackGameModel.findById',
    )
    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logError,
      'logger.error',
    )
  })
})

describe('Game Exists', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validGameSeed = getRandomSeed()
  const cases = [
    {
      name: 'Game Exists With Status As Expected',
      inputs: {
        id: '2a50d4d9-c1e7-4771-84ac-bbcb36291be1',
        exists: true,
        status: GameStatus.Pending,
        hash: validGameSeed,
      },
      expects: {
        exists: true,
      },
    },
    {
      name: 'Game Status Unexpected',
      inputs: {
        id: '2a50d4d9-c1e7-4771-84ac-bbcb36291be1',
        exists: true,
        status: GameStatus.Pending,
        hash: validGameSeed,
      },
      expects: {
        exists: false,
      },
    },
    {
      name: 'Game Does Not Exist',
      inputs: {
        id: '2a50d4d9-c1e7-4771-84ac-bbcb36291be1',
        exists: false,
        status: GameStatus.Pending,
        hash: validGameSeed,
      },
      expects: {
        exists: false,
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { id, exists, status, hash } = inputs
    const { exists: shouldExist } = expects
    const validGame: GameState = {
      id,
      hash,
      seed: hash,
      players: [{ playerId: 'test', hands: [] }, DealerSeatDefault],
      status: shouldExist ? status : GameStatus.Complete, // Avoid `Complete` in the case to test non-existence
    }

    // Mock the cached function
    jest
      .spyOn(cacheLib, 'cached')
      .mockResolvedValue(
        exists ? validGame : (undefined as unknown as GameState),
      )

    await expect(gameDoc.gameExists(id, status)).resolves.toBe(shouldExist)

    expect(cacheLib.cached).toHaveBeenCalledTimes(1)
    expect(cacheLib.cached).toHaveBeenCalledWith(
      ...gameDoc.cacheKey(id),
      gameDoc.GameCacheSeconds,
      expect.any(Function),
    )
  })
})

describe('Upsert Game', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const errorGameId = '2a50d4d9-c1e7-4771-84ac-bbcb36291be1'
  const errorReceipt = {
    acknowledged: false,
    matchedCount: 0,
    modifiedCount: 0,
    upsertedId: undefined as unknown as Types.ObjectId,
    upsertedCount: 0,
    upsertedIds: [],
  }
  const cases = [
    {
      name: 'Upsert A Game As Expected',
      inputs: {
        receipt: {
          acknowledged: true,
          matchedCount: 1,
          modifiedCount: 1,
        },
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        game: {} as GameState,
      },
      expects: {
        throws: false,
      },
    },
    {
      name: 'Upsert A Game Errors As Expected',
      inputs: {
        receipt: errorReceipt,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        game: {
          id: errorGameId,
        } as GameState,
      },
      expects: {
        throws: new BlackjackUpsertFailedError(
          errorGameId,
          expect.any(String),
          errorReceipt,
        ),
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { receipt, game } = inputs
    const { throws } = expects

    // Mock the `BlackjackGameModel.updateOne` function to return as expected
    gameDoc.BlackjackGameModel.updateOne = jest.fn(
      async (_filter, _update, _options) => Promise.resolve(receipt),
    )

    // Mock the `cache.set` function to return as expected
    jest.spyOn(cacheLib, 'set').mockResolvedValue(Promise.resolve())
    getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      await expect(gameDoc.upsertGame(game)).rejects.toThrow(throws)
    } else {
      await expect(gameDoc.upsertGame(game)).resolves.toBe(game)
    }
  })
})

describe('Delete Game', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validGameId = getObjectIdValue()
  const cases = [
    {
      name: 'Delete A Game As Expected',
      inputs: {
        gameId: validGameId,
      },
      expects: {
        throws: false,
        calls: {
          deleteOne: { 0: [{ _id: validGameId }] },
          invalidate: { 0: ['blackjack', `game_${validGameId}`] },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { gameId } = inputs
    const { throws } = expects

    // Mock the model to return as expected
    gameDoc.BlackjackGameModel.deleteOne = jest.fn(async _filter =>
      Promise.resolve({
        acknowledged: true,
        deletedCount: 1,
      }),
    )

    // Mock the cache function to return as expected
    jest.spyOn(cacheLib, 'invalidate').mockResolvedValue(Promise.resolve())

    getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      await expect(gameDoc.deleteGame(gameId)).rejects.toThrow(throws)
    } else {
      await expect(gameDoc.deleteGame(gameId)).resolves.toBeUndefined()
    }
  })
})

describe('Get Games For Player', () => {
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
    gameDoc.BlackjackGameModel.find = jest.fn(async _ =>
      Promise.resolve(
        games.map(game => ({
          ...game,
          toObject: transformerRef(game),
        })),
      ),
    )

    getMockedLogger()

    const result = await gameDoc.getGamesForPlayer(playerId)

    expect(result).toHaveLength(gameCount)
    expect(result).toStrictEqual(expectedGames)
  })
})
