import express from 'express'

import { type RouterApp } from 'src/util/api'
import { api } from 'src/util/api'
import { roleCheck } from 'src/modules/admin/middleware'

import { banIp, unbanIp, getIPBanlist } from '../documents/ip_banlist'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/ip', router)

  router.get(
    '/banlist',
    api.check,
    ...roleCheck([{ resource: 'ipban', action: 'read' }]),
    api.validatedApiCall(async () => {
      return await getIPBanlist()
    }),
  )

  router.post(
    '/banlist/remove',
    api.check,
    ...roleCheck([{ resource: 'ipban', action: 'update' }]),
    api.validatedApiCall(async req => {
      // remove ip from banlist
      await unbanIp(req.body.ip)
    }),
  )

  router.post(
    '/banlist/add',
    api.check,
    ...roleCheck([{ resource: 'ipban', action: 'update' }]),
    api.validatedApiCall(async req => {
      // add IP to banlist
      await banIp(req.body.ip)
    }),
  )
}
