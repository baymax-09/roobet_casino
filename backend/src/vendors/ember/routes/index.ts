import express from 'express'

import { type RouterApp } from 'src/util/api'
import { createEmberCallbackRouter } from './callback'
import { createEmberInternalRouter } from './internal'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/ember', router)

  createEmberInternalRouter(router)
  createEmberCallbackRouter(router)
}
