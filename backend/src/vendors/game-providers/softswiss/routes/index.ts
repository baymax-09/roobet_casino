import express from 'express'

import { type RouterApp } from 'src/util/api'

import callbackRoutes from './callback'
import internalRoutes from './internal'
import adminRoutes from './admin'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/softswiss', router)

  adminRoutes(router)
  internalRoutes(router)
  callbackRoutes(router)
}
