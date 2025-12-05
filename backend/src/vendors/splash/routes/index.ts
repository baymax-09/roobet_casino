import express, { type Response } from 'express'

import { type RouterApp, api } from 'src/util/api'

import { getUserIdByName, userExistsByName } from 'src/modules/user'
import { initiateBonusCode } from 'src/modules/crm'
import { MongoErrorCodes } from 'src/system'

import { validateSplashAuthorization } from '../lib'
import {
  type SplashClaim,
  createSplashClaim,
  deleteSplashClaim,
} from '../documents/splashClaims'

const successResponse = (res: Response, response: Record<string, unknown>) => {
  res.status(200).send(response)
}

const errorResponse = (res: Response, error: string) => {
  res.status(400).send({ error })
}

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/splash', router)

  router.post(
    '/verifyUsername',
    validateSplashAuthorization,
    api.asyncCallback(async (req, res) => {
      const { username } = req.body

      if (typeof username !== 'string') {
        errorResponse(res, "Parameter 'username' must be a string")
        return
      }

      const exists = await userExistsByName(username.toLowerCase())

      successResponse(res, { exists })
    }),
  )

  router.post(
    '/claim',
    validateSplashAuthorization,
    api.asyncCallback(async (req, res) => {
      const { username, bonusCode, transactionId } = req.body

      if (typeof username !== 'string') {
        errorResponse(res, "Parameter 'username' must be a string")
        return
      }

      if (typeof bonusCode !== 'string') {
        errorResponse(res, "Parameter 'bonusCode' must be a string")
        return
      }

      if (typeof transactionId !== 'string') {
        errorResponse(res, "Parameter 'transactionId' must be a string")
        return
      }

      const userId = await getUserIdByName(username, true)

      if (!userId) {
        errorResponse(res, 'No user found with specified username.')
        return
      }

      let claim: SplashClaim | undefined

      // Write to claim collection to prevent duplicate issuing.
      try {
        claim = await createSplashClaim({
          userId,
          bonusCode,
          transactionId,
        })
      } catch (error) {
        const message =
          error.code === MongoErrorCodes.DUPLICATE_KEY
            ? 'Bonus already claimed.'
            : 'Failed to issue specified bonus to user.'

        errorResponse(res, message)
        return
      }

      // Issue freespins.
      try {
        await initiateBonusCode(
          bonusCode,
          userId,
          'Splash Bonus Code Claim',
          'splash',
        )
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to issue specified bonus to user.'

        // Delete claim document so the transaction can be processed again.
        await deleteSplashClaim(claim._id)

        errorResponse(res, message)
        return
      }

      successResponse(res, { claimed: true })
    }),
  )
}
