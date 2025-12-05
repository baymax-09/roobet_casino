import { type RouterApp } from 'src/util/api'

import { createCallbackRouter } from './callbacks'
import { createAdminRouter } from './admin'

export default function (app: RouterApp) {
  // Callbacks.
  app.use('/slotegrator/gis/callback', createCallbackRouter())
  app.use('/slotegrator/gis/admin', createAdminRouter())
}
