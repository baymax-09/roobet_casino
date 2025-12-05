import {
  type RouterApp,
  type RouterPassport,
  type RouterIO,
  type RouterExpress,
} from 'src/util/api'
import { type ModuleRoute, loadRoutes } from 'src/modules'
import { setupLogger } from './lib/logger'

export const mountRoutes = (
  app: RouterApp,
  passport: RouterPassport,
  io: RouterIO,
  express: RouterExpress,
) => {
  const routes: ModuleRoute[] = loadRoutes()

  for (const route of routes) {
    if (typeof route === 'function') {
      route(app, passport, io, express)
    }
  }

  setupLogger('mountRoutes', { userId: null }).info(
    'Loaded dynamic module routers',
    { numberOfRouters: routes.length },
  )
}
