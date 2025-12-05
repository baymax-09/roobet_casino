import { type RouterApp } from 'src/util/api'
import { api } from 'src/util/api'

import { createCallbackRouter } from './callback'
import { createAdminRouter } from './admin'

export default function (app: RouterApp) {
  // Callbacks.
  app.use('/hacksaw/callback', createCallbackRouter())

  // for creating game sessions on the frontend
  app.use('/hacksaw/internal', api.check, createAdminRouter())
}
