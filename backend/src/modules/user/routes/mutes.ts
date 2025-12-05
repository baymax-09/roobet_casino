import express from 'express'

import {
  getMutesByUserId,
  updateMutesByUserId,
} from 'src/modules/user/documents/mutes'
import { api, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'

export default function (app: express.Router) {
  const router = express.Router()
  app.use('/mutes', router)

  router.get(
    '/get',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      return await getMutesByUserId(user.id)
    }),
  )

  router.post(
    '/set',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { userId, muted } = req.body
      if (userId == user.id) {
        throw new APIValidationError('user__mute_yourself')
      }

      await updateMutesByUserId(user.id, userId, muted)
      return { success: true }
    }),
  )
}
