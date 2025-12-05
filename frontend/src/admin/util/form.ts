export const helperTextErrorHelper = (errorMessage: unknown) => {
  if (errorMessage) {
    if (typeof errorMessage === 'string') {
      return errorMessage
    }
    return 'Unknown error.'
  }
  return undefined
}
