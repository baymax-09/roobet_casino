import { type Document, type FlatRecord, type Types } from 'mongoose'
import '../test/extensions'
import {
  buildBasicDealtGame,
  buildBasicDealtGameWithPlayerId,
  getMockedLogger,
} from '../test/utils'
import { type GameState, type PlayerSeatWithLiveWager } from '../types'
import * as histDoc from './blackjackHistory'
import { toObjectOptions, type DBBlackjackGame } from './blackjackSchemas'

// Enables running the `toObject` transformer on the game object
type GameDocType = Document<unknown, unknown, FlatRecord<DBBlackjackGame>> &
  FlatRecord<DBBlackjackGame> & { _id: Types.ObjectId }
const transformerRef = (game: GameState) => () => {
  if (typeof toObjectOptions.transform === 'function') {
    return toObjectOptions.transform(game as GameDocType, game, {})
  }
  return game
}

describe('Record History', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validGame = buildBasicDealtGame()
  const cases = [
    {
      name: 'Writes A History Record As Expected',
      inputs: {
        game: validGame,
      },
      expects: {
        throws: false,
        calls: {
          logError: { 0: [] },
          insertMany: { 1: [[{ ...validGame, _id: expect.any(String) }]] },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { game } = inputs
    const { throws, calls } = expects

    // Create a new logger with the silent option set to true
    const logger = getMockedLogger()

    // Mock the model to return as expected
    histDoc.BlackjackGameHistoryModel.insertMany = jest.fn(async game =>
      Promise.resolve([
        {
          ...game,
          toObject: transformerRef(game),
        },
      ]),
    )

    if (throws !== false && typeof throws === 'object') {
      await expect(histDoc.recordHistory(game)).rejects.toThrow(throws)
    } else {
      await expect(histDoc.recordHistory(game)).resolves.not.toThrow()
    }

    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      histDoc.BlackjackGameHistoryModel.insertMany,
    ).toHaveBeenCalledWithNthArgs(calls.insertMany, 'calls.insertMany')
    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logError,
      'calls.logError',
    )
  })
})

describe('History By Bet ID', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validGame = buildBasicDealtGame()
  const validBetId = (validGame.players[0] as PlayerSeatWithLiveWager).betId
  const cases = [
    {
      name: 'Finds History By Bet ID As Expected',
      inputs: {
        betId: validBetId,
        game: validGame,
        findOne: null,
      },
      expects: {
        throws: false,
        calls: {
          logError: { 0: [] },
          findOne: { 1: [{ players: { $elemMatch: { betId: validBetId } } }] },
        },
      },
    },
    {
      name: 'Returns Null As Expected',
      inputs: {
        betId: validBetId,
        game: validGame,
      },
      expects: {
        throws: false,
        calls: {
          logError: { 0: [] },
          findOne: { 1: [{ players: { $elemMatch: { betId: validBetId } } }] },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { game, betId, findOne } = inputs
    const { throws, calls } = expects

    // Create a new logger with the silent option set to true
    const logger = getMockedLogger()

    // Mock the model to return as expected
    histDoc.BlackjackGameHistoryModel.findOne = jest.fn(async _filter =>
      Promise.resolve(
        findOne !== undefined
          ? findOne
          : {
              ...game,
              toObject: transformerRef(game),
            },
      ),
    )

    if (throws !== false && typeof throws === 'object') {
      await expect(histDoc.getHistoryByBetId(betId)).rejects.toThrow(throws)
    } else {
      let result: GameState | null | undefined
      await expect(
        histDoc.getHistoryByBetId(betId).then(res => {
          result = res
          return res
        }),
      ).resolves.not.toThrow()
      expect(result).toBe(findOne !== undefined ? findOne : game)
    }

    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      histDoc.BlackjackGameHistoryModel.findOne,
    ).toHaveBeenCalledWithNthArgs(calls.findOne, 'calls.findOne')
    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logError,
      'calls.logError',
    )
  })
})

describe('History For Player', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const { game: validGame, playerId } = buildBasicDealtGameWithPlayerId()
  const query = { players: { $elemMatch: { playerId } } }
  const cases = [
    {
      name: 'Gets History For Player As Expected',
      inputs: {
        playerId,
        countDocs: 30,
        find: new Array(30).fill(validGame),
      },
      expects: {
        calls: {
          find: { 1: [query] },
          countDocuments: { 1: [query] },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { playerId, find, countDocs } = inputs
    const { calls } = expects

    // Create a new logger with the silent option set to true
    getMockedLogger()

    // Mock the model to return as expected
    histDoc.BlackjackGameHistoryModel.countDocuments = jest.fn(async _filter =>
      Promise.resolve(countDocs),
    )
    histDoc.BlackjackGameHistoryModel.find = jest.fn(_filter => ({
      skip(offset: number) {
        return {
          limit(limit: number) {
            return Promise.resolve(
              find
                .slice(offset, offset + limit)
                .map(game => ({ ...game, toObject: transformerRef(game) })),
            )
          },
        }
      },
    }))

    let result: histDoc.BlackjackPagedHistory | undefined
    await expect(
      histDoc.getHistoryForPlayer(playerId).then(res => {
        result = res
        return res
      }),
    ).resolves.not.toThrow()
    expect(result).toBeDefined()
    expect(result!.total).toEqual(countDocs)
    expect(result!.records).toHaveLength(10)
    expect(result!.records).toEqual(find.slice(0, 10))

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(histDoc.BlackjackGameHistoryModel.find).toHaveBeenCalledWithNthArgs(
      calls.find,
      'calls.find',
    )
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      histDoc.BlackjackGameHistoryModel.countDocuments,
    ).toHaveBeenCalledWithNthArgs(calls.countDocuments, 'calls.countDocuments')
  })
})
