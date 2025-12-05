import { Types } from 'mongoose'
import { APIValidationError } from '../../../util/errors'
import { translateWithLocale } from '../../../util/i18n'
import { getMockedLogger, getObjectIdValue } from '../test/utils'
import {
  BlackjackActiveWagerUpdateError,
  BlackjackAggregateError,
  BlackjackAlreadyInsuredWagerError,
  BlackjackBadTableDealerError,
  BlackjackDealerStatusError,
  BlackjackDoubleDownWagerError,
  BlackjackError,
  BlackjackGameNotFoundError,
  BlackjackGameShoeExhaustedError,
  BlackjackInsufficientFundsError,
  BlackjackInsureWagerError,
  BlackjackInvalidActionError,
  BlackjackInvalidCloseoutError,
  BlackjackInvalidGameIdError,
  BlackjackInvalidHandError,
  BlackjackInvalidWagersError,
  BlackjackMissingGameHashError,
  BlackjackMissingGameSeedError,
  BlackjackMissingPlayerHandError,
  BlackjackMissingRoundIdError,
  BlackjackMutexError,
  BlackjackNoActiveWagerError,
  BlackjackNoPlayersError,
  BlackjackNoUsableWagerError,
  BlackjackNonGamePlayerError,
  BlackjackPlayerNotFoundError,
  BlackjackSideBetCalculationError,
  BlackjackSplitWagerError,
  BlackjackUpsertFailedError,
  BlackjackWrongPlayerHandError,
  BlackjackInvalidRequestError,
  getClientError,
} from './errors'
import { HandActionType, HandWagerType } from './player'

describe('Errors', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const handIndex = 0
  const logScope = 'testing'
  const recordId = new Types.ObjectId()
  const betId = getObjectIdValue()
  const gameId = getObjectIdValue()
  const playerId = getObjectIdValue()
  const blackjackErrors = [
    new BlackjackActiveWagerUpdateError(
      gameId,
      playerId,
      handIndex,
      betId,
      logScope,
    ),
    new BlackjackAggregateError(gameId, logScope, [
      new BlackjackInvalidGameIdError(gameId, logScope),
    ]),
    new BlackjackAlreadyInsuredWagerError(
      gameId,
      playerId,
      handIndex,
      betId,
      logScope,
    ),
    new BlackjackBadTableDealerError(gameId, logScope),
    new BlackjackDoubleDownWagerError(
      gameId,
      playerId,
      handIndex,
      betId,
      logScope,
    ),
    new BlackjackError('Blackjack Error', gameId, logScope, {
      action: HandActionType.Hit,
    }),
    new BlackjackGameNotFoundError(gameId, logScope),
    new BlackjackGameShoeExhaustedError(gameId, logScope),
    new BlackjackInsureWagerError(gameId, playerId, handIndex, betId, logScope),
    new BlackjackInvalidActionError(
      gameId,
      logScope,
      playerId,
      handIndex,
      HandActionType.Hit,
    ),
    new BlackjackInvalidGameIdError(gameId, logScope),
    new BlackjackInvalidHandError(
      gameId,
      logScope,
      playerId,
      handIndex,
      HandActionType.Hit,
    ),
    new BlackjackInvalidWagersError(gameId, logScope),
    new BlackjackMissingGameHashError(gameId, logScope),
    new BlackjackMissingGameSeedError(gameId, logScope),
    new BlackjackMissingPlayerHandError(gameId, logScope),
    new BlackjackMissingRoundIdError(gameId, logScope),
    new BlackjackMutexError(gameId, logScope),
    new BlackjackNoActiveWagerError(
      gameId,
      playerId,
      handIndex,
      betId,
      logScope,
    ),
    new BlackjackNonGamePlayerError(gameId, logScope, playerId),
    new BlackjackNoPlayersError(gameId, logScope),
    new BlackjackNoUsableWagerError(gameId, logScope),
    new BlackjackPlayerNotFoundError(gameId, logScope, playerId),
    new BlackjackSideBetCalculationError(HandWagerType.PerfectPair, logScope),
    new BlackjackSplitWagerError(gameId, playerId, handIndex, betId, logScope),
    new BlackjackUpsertFailedError(gameId, logScope, {
      acknowledged: false,
      matchedCount: 0,
      modifiedCount: 0,
      upsertedCount: 0,
      upsertedId: recordId,
    }),
    new BlackjackInsufficientFundsError(
      gameId,
      playerId,
      handIndex,
      betId,
      logScope,
    ),
    new BlackjackDealerStatusError(gameId, logScope),
    new BlackjackInvalidCloseoutError(gameId, logScope),
    new BlackjackWrongPlayerHandError(
      gameId,
      logScope,
      playerId,
      playerId,
      handIndex,
      handIndex,
    ),
    new BlackjackInvalidRequestError(gameId, logScope),
  ].map(error => ({
    name: error.toString().split(':').pop()?.trim(),
    error,
    client: getClientError(error).message,
  }))

  it.each(blackjackErrors)('$name', ({ error }) => {
    const logger = getMockedLogger()
    let apiError: APIValidationError | undefined
    expect(() => {
      BlackjackError.logAndIgnore(error)
      apiError = BlackjackError.logAndReturnForClient(error)
    }).not.toThrow()
    expect(logger.error).toHaveBeenCalledTimes(2)
    expect(apiError).toBeDefined()
    expect(apiError).toBeInstanceOf(APIValidationError)

    const clientError = translateWithLocale(
      ['en'],
      apiError!.message,
      apiError!.args,
    )
    expect(clientError).not.toContain('blackjack_')
    expect(clientError).not.toContain('%s')
    expect(clientError).not.toContain('%d')
  })

  it('Logs Regular Errors As Expected', () => {
    const logger = getMockedLogger()
    BlackjackError.logAndIgnore(new Error('Test Error'))
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('Logs Raw Errors As Expected', () => {
    const logger = getMockedLogger()
    BlackjackError.logAndIgnore('Test Error')
    expect(logger.error).toHaveBeenCalledTimes(1)
  })
})
