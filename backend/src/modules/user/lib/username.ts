const usernameRegex = /^[a-zA-Z0-9]*$/
/**
 * @todo move length requirement and reason into this check
 */
export const isUsernameValid = (username: string): boolean => {
  return usernameRegex.test(username)
}
