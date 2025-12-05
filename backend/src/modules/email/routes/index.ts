import express from 'express'

import { config, getBackendUrlFromReq, getFrontendUrlFromReq } from 'src/system'
import { type RouterApp, api, type RoobetReq } from 'src/util/api'
import { updateUserEmail } from 'src/modules/user/documents/user'
import { updateConsentForUserId } from 'src/modules/crm/documents/consent'

import { checkVerification } from '../lib/verification'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/email', router)

  router.get(
    '/verify',
    api.validatedApiCall(async (req, res) => {
      const { verificationToken, returnUrl } = req.query

      const redirectUrl =
        typeof returnUrl === 'string'
          ? decodeURIComponent(returnUrl)
          : config.appSettings.frontendBase

      if (typeof verificationToken !== 'string') {
        res.redirect(`${redirectUrl}?emailVerified=false`)
        return
      }

      const user = await checkVerification(verificationToken, req)

      // If email verified successfully, consent them to receive emails via Fast Track CRM
      if (user) {
        await updateConsentForUserId(user.id, { email: true })
      }

      res.redirect(`${redirectUrl}?emailVerified=${!!user}`)
    }),
  )

  router.post(
    '/resendVerificationEmail',
    api.check,
    api.validatedApiCall(async req => {
      let {
        body: { email },
      } = req
      const { user } = req as RoobetReq

      // user is not setting a new email in this case
      if (!email) {
        email = user.email
      }

      const apiUrl = getBackendUrlFromReq(req)
      const returnUrl = getFrontendUrlFromReq(req)

      await updateUserEmail({ user, email, apiUrl, returnUrl })
    }),
  )
}
