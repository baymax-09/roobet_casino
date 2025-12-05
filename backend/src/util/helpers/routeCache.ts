import ExpressRedisCache from 'express-redis-cache'
import { type Request, type Response, type NextFunction } from 'express'

import { redis } from 'src/system'

export const cache = ExpressRedisCache({
  expire: 5,
  client: redis,
})

function sortedParams(query: object) {
  return Object.entries(query)
    .sort(([key], [key2]) => (key > key2 ? 1 : -1))
    .map(([key, val]) => `${key}=${val}`)
    .join(':')
}

/**
 * This doesn't work - it needs to be tested with multiple users.
 * Right now it caches once for all users.
 */
export function userRouteCache(options = {}) {
  return function (req: Request, res: Response, next: NextFunction) {
    const query = { ...req.query }
    delete query.token
    const params = sortedParams(query)
    // @ts-expect-error TODO test this function or remove?
    const name = `${req.path}-${params}-${req.user.id}`
    cache.route({ ...options, name })(req, res, next)
  }
}

export function routeCache(options = {}) {
  return function (req: Request, res: Response, next: NextFunction) {
    const query = { ...req.query }
    delete query.token
    const params = sortedParams(query)
    const name = `${req.path}-${params}`
    cache.route({ ...options, name })(req, res, next)
  }
}
