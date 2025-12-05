import express from 'express'

import { type RouterApp } from 'src/util/api'

import callbackRoutes from './callback'
import internalRoutes from './internal'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/hub88', router)

  router.get('/', function (req, res) {
    res.json({ success: true })
  })

  internalRoutes(router)
  callbackRoutes(router)
}
