import { matcherHint, printExpected, printReceived } from 'jest-matcher-utils'

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
