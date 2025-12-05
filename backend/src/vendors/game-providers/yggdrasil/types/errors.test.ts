import { APIValidationError } from '../../../../util/errors'
import { translateWithLocale } from '../../../../util/i18n'
import { getMockedLogger, getObjectIdValue } from '../test/utils'
import {
  YggdrasilAggregateError,
  YggdrasilDisabledError,
  YggdrasilError,
  YggdrasilInvalidGameError,
  YggdrasilInvalidGameIdError,
  YggdrasilInvalidOpError,
  YggdrasilInvalidOrgError,
  YggdrasilInvalidSessionTokenError,
  getClientError,
} from './errors'

describe('Errors', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const logScope = 'testing'
  const gameId = getObjectIdValue()
  const yggdrasilErrors = [
    new YggdrasilError('Yggdrasil Error', gameId, logScope, {
      playerId: getObjectIdValue(),
    }),
    new YggdrasilAggregateError(gameId, logScope, [
      new YggdrasilInvalidGameIdError(gameId, logScope),
    ]),
    new YggdrasilInvalidGameIdError(gameId, logScope),
    new YggdrasilDisabledError(logScope),
    new YggdrasilInvalidGameError(logScope),
    new YggdrasilInvalidSessionTokenError('token', logScope),
    new YggdrasilInvalidOrgError('org', logScope),
    new YggdrasilInvalidOpError('op', logScope),
  ].map(error => ({
    name: error.toString().split(':').pop()?.trim(),
    error,
    client: getClientError(error).message,
  }))

  it.each(yggdrasilErrors)('$name', ({ error }) => {
    const logger = getMockedLogger()
    let apiError: APIValidationError | undefined
    expect(() => {
      YggdrasilError.logAndIgnore(error)
      apiError = YggdrasilError.logAndReturnForClient(error)
    }).not.toThrow()
    expect(logger.error).toHaveBeenCalledTimes(2)
    expect(apiError).toBeDefined()
    expect(apiError).toBeInstanceOf(APIValidationError)

    const clientError = translateWithLocale(
      ['en'],
      apiError!.message,
      apiError!.args,
    )
    expect(clientError).not.toContain('yggdrasil_')
    expect(clientError).not.toContain('%s')
    expect(clientError).not.toContain('%d')
  })

  it('Logs Regular Errors As Expected', () => {
    const logger = getMockedLogger()
    YggdrasilError.logAndIgnore(new Error('Test Error'))
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('Logs Raw Errors As Expected', () => {
    const logger = getMockedLogger()
    YggdrasilError.logAndIgnore('Test Error')
    expect(logger.error).toHaveBeenCalledTimes(1)
  })
})
