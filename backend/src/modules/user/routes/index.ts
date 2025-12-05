import express from 'express'

import {
  type RouterApp,
  type RouterPassport,
  type RouterIO,
} from 'src/util/api'

import kycRoutes from 'src/modules/fraud/kyc/routes/kyc'
import kycv2Routes from 'src/modules/fraud/kyc/routes/kycv2'

import accountRoutes from './account'
import muteRoutes from './mutes'
import historyRoutes from './history'

export default function (
  app: RouterApp,
  passport: RouterPassport,
  io: RouterIO,
) {
  const router = express.Router()
  app.use('/user', router)

  // mount sub-routes for user
  accountRoutes(router, passport, io)
  kycRoutes(router)
  kycv2Routes(router)
  muteRoutes(router)

  // mount legacy routes that relate to users but are not under /user
  accountRoutes(app, passport, io)
  historyRoutes(app)
}
