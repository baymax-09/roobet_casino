export const isFulfilled = <T>(
  input: PromiseSettledResult<T>,
): input is PromiseFulfilledResult<T> => input.status === 'fulfilled'

export const isRejected = <T>(
  input: PromiseSettledResult<T>,
): input is PromiseRejectedResult => input.status === 'rejected'
