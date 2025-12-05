import { matcherHint, printExpected, printReceived } from 'jest-matcher-utils'

/**
 * This extension is used to check if a mock function was called with the expected arguments on a specific call number.
 * Logging is one such use case that requires this kind of assertion.
 * @example
 * ```ts
 * import * as test from '../test'
 *
 * it('logs the correct messages', () => {
 *  const logger = test.getMockedLogger()
 *  logger.error('error message 1')
 *  logger.error('error message 2')
 *  expect(logger.error).toHaveBeenCalledWithNthArgs(
 *   {
 *     1: ['error message 1'], // Call 1 should have this message
 *     2: ['error message 2'], // Call 2 should have this message
 *   },
 *   'logger.error',
 *  )
 * })
 * ```
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledWithNthArgs: (
        expectedCalls: Record<number, any[] | undefined>,
        moniker: string,
      ) => CustomMatcherResult
    }
  }
}

expect.extend({
  toHaveBeenCalledWithNthArgs(
    received: jest.Mock,
    expectedCalls: Record<number, any[]>,
    moniker: string,
  ) {
    let pass = true
    let failedCallNumber = 0
    let failedExpectedArgs: any[] = []
    let failedReceivedArgs: any[] = []

    Object.entries(expectedCalls).forEach(([callNumber, expectedArgs]) => {
      const callIndex = parseInt(callNumber) - 1
      const receivedArgs = received.mock.calls[callIndex] ?? []
      if (!this.equals(receivedArgs, expectedArgs)) {
        pass = false
        failedCallNumber = callIndex + 1
        failedExpectedArgs = expectedArgs
        failedReceivedArgs = receivedArgs
      }
    })

    const message = pass
      ? () =>
          `${matcherHint('.not.toHaveBeenCalledWithNthArgs')}\n\n` +
          `Expected ${moniker} not to be called with specified args on call number ${printExpected(
            failedCallNumber,
          )}`
      : () =>
          `${matcherHint('.toHaveBeenCalledWithNthArgs')}\n\n` +
          `Expected ${moniker} to be called with:\n  ${printExpected(
            failedExpectedArgs,
          )}\n` +
          `on call number ${printExpected(
            failedCallNumber,
          )} but received:\n  ${printReceived(failedReceivedArgs)}`

    return { message, pass }
  },
})
