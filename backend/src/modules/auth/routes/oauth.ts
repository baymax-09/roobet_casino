import express from 'express'

import { api, type RouterPassport, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { getUserPasswordForUser } from 'src/modules/auth'

import {
  setOauthProviderForUser,
  signupMiddleware,
  linkMiddleware,
  oauthCompleteRoute,
  redirectMiddleware,
  recaptchaMiddleware,
  getFrontendBase,
  confirmLinkRoute,
  postOauthRedirectMiddleware,
} from '../lib/oauth'
import { facebookAuthRoute, facebookCallbackRoute } from '../lib/facebook'
import { googleAuthRoute, googleCallbackRoute } from '../lib/google'
import { metamaskAuthRoute, metamaskNonceRoute } from '../lib/metamask'
import { steamAuthRoute, steamCallbackRoute } from '../lib/steam'

export default function (passport: RouterPassport) {
  const router = express.Router()

  router.post(
    '/removeOauthProvider',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { provider } = req.body
      const userId = user.id
      if (!provider) {
        throw new APIValidationError('no__provider')
      }

      const userPassword = await getUserPasswordForUser(user.id)
      if (!userPassword?.hasPassword) {
        throw new APIValidationError('auth__oauth_no_password')
      }

      try {
        await setOauthProviderForUser(userId, provider, null, null)
      } catch (err) {
        throw new APIValidationError('auth__oauth_disconnect')
      }
      return { success: true }
    }),
  )

  router.get(
    '/google',
    recaptchaMiddleware,
    signupMiddleware,
    postOauthRedirectMiddleware,
    async (req, res, next) => {
      await googleAuthRoute(req, res, next, passport)
    },
  )
  router.get(
    '/google/link',
    api.check,
    linkMiddleware,
    async (req, res, next) => {
      await googleAuthRoute(req, res, next, passport)
    },
  )
  router.get(
    '/google/confirmLink',
    linkMiddleware,
    async (req, res, next) => {
      await confirmLinkRoute(req, res, next, 'google')
    },
    oauthCompleteRoute,
  )
  router.get('/google/callback', (req, res) => {
    redirectMiddleware(req, res, 'google')
  })
  router.get(
    '/google/redirectCallback',
    async (req, res, next) => {
      await googleCallbackRoute(req, res, next, passport)
    },
    oauthCompleteRoute,
  )

  router.get(
    '/facebook',
    recaptchaMiddleware,
    signupMiddleware,
    postOauthRedirectMiddleware,
    async (req, res, next) => {
      await facebookAuthRoute(req, res, next, passport)
    },
  )
  router.get(
    '/facebook/link',
    api.check,
    linkMiddleware,
    async (req, res, next) => {
      await facebookAuthRoute(req, res, next, passport)
    },
  )
  router.get('/facebook/callback', (req, res) => {
    redirectMiddleware(req, res, 'facebook')
  })
  router.get(
    '/facebook/redirectCallback',
    async (req, res, next) => {
      await facebookCallbackRoute(req, res, next, passport)
    },
    oauthCompleteRoute,
  )

  router.get(
    '/metamask',
    recaptchaMiddleware,
    postOauthRedirectMiddleware,
    async (req, res, next) => {
      await metamaskAuthRoute(req, res, next, passport)
    },
    oauthCompleteRoute,
  )
  router.get(
    '/metamask/link',
    api.check,
    linkMiddleware,
    async (req, res, next) => {
      await metamaskAuthRoute(req, res, next, passport)
    },
    (req, res) => {
      res.redirect(getFrontendBase(req) + '?excludeReferrer=true')
    },
  )
  router.get('/metamask/link/nonce', api.check, metamaskNonceRoute)
  router.get('/metamask/nonce', signupMiddleware, metamaskNonceRoute)

  router.get(
    '/steam',
    recaptchaMiddleware,
    signupMiddleware,
    postOauthRedirectMiddleware,
    (req, res, next) => {
      steamAuthRoute(req, res, next, passport)
    },
  )
  router.get('/steam/link', api.check, linkMiddleware, (req, res, next) => {
    steamAuthRoute(req, res, next, passport)
  })
  router.get('/steam/callback', (req, res) => {
    redirectMiddleware(req, res, 'steam')
  })
  router.get(
    '/steam/redirectCallback',
    (req, res, next) => {
      steamCallbackRoute(req, res, next, passport)
    },
    oauthCompleteRoute,
  )

  return router
}
