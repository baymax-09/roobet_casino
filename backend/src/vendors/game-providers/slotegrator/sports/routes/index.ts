import { type RouterApp } from 'src/util/api'
import { api } from 'src/util/api'

import { createCallbackRouter } from './callbacks'
import { createAdminRouter } from './admin'

export default function (app: RouterApp) {
  // Callbacks.
  app.use('/slotegrator/callback', createCallbackRouter())

  // Admin routes, behind auth.
  app.use('/admin/slotegrator', api.check, createAdminRouter())
}
