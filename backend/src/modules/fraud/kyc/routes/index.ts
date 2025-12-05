import express from 'express'

import { type RouterApp } from 'src/util/api'

import kycRoutes from './kyc'
import kycv2Routes from './kycv2'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/kyc', router)

  kycRoutes(router)
  kycv2Routes(router)
}
