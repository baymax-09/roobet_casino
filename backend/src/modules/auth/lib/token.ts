import { Strategy as CustomStrategy } from 'passport-custom'

export function getTokenStrategy() {
  return new CustomStrategy(function (req, done) {
    if (req.user) {
      req.setLocale(req.user.locale || 'en')
      done(null, req.user)
      return
    }

    done(null)
  })
}
