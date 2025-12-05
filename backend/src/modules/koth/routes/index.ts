import express from 'express'

import { type RouterApp, api, type RoobetReq } from 'src/util/api'
import { createAdminKOTHRouter } from './admin'

import { trimForFrontend } from '../lib'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/koth', router)
  app.use('/admin/koth', createAdminKOTHRouter())

  router.get(
    '/active',
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const isStaff = !!user?.staff
      const requestingUserId = user?.id
      return await trimForFrontend(isStaff, requestingUserId)
    }),
  )
}
