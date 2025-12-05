import passport from 'passport'

import { getUserById } from 'src/modules/user'
import { getGoogleStrategy } from './google'
import { getTokenStrategy } from './token'
import { getFacebookStrategy } from './facebook'
import { getMetamaskStrategy } from './metamask'
import { getSteamStrategy } from './steam'

passport.serializeUser(function (user, done) {
  done(null, user.id)
})

passport.deserializeUser(async function (id, done) {
  if (typeof id !== 'string') {
    done('invalid session')
    return
  }
  const user = await getUserById(id)
  done(null, user)
})

const strategies = [
  { name: 'google', strategyFcn: getGoogleStrategy },
  { name: 'token', strategyFcn: getTokenStrategy },
  { name: 'facebook', strategyFcn: getFacebookStrategy },
  { name: 'metamask', strategyFcn: getMetamaskStrategy },
  { name: 'steam', strategyFcn: getSteamStrategy },
]

export function initializePassport() {
  for (const { name, strategyFcn } of strategies) {
    passport.use(name, strategyFcn())
  }
  return passport
}
