import { initializePassport } from './lib/passport'

export * as Documents from './documents'
export * as Routes from './routes'
export * as Types from './types'

export * from './documents/user_password'

export { getOauthIdForUser, getOauthExtraCredsForUser } from './lib/oauth'
export { twoFactorCheck, require2faEnabled } from './middleware'
export { getSecurityInfoForUser } from './documents/user_password'
export { touchUserSession } from './documents/user_session'
export { isPasswordValid } from './lib/password'

export function getPassport() {
  return initializePassport()
}
