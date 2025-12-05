import { type Request } from 'express'
import rateLimiter from 'redis-rate-limiter'

import { getRawIpFromRequest } from 'src/modules/fraud/geofencing'
import { redisCache } from 'src/system'

/**
 * We are currently testing this on /account/transfer for tip debouncing.
 * We need to make a dedicated Redis client for debouncing
 */
function debounceMiddleware(
  routeName: string,
  getUniqueIdFunction: ((req: Request) => string | undefined) | null,
  opts = { window: 3, limit: 15 },
) {
  return rateLimiter.middleware({
    redis: redisCache,
    key: req => {
      const uniqueId = getUniqueIdFunction
        ? getUniqueIdFunction(req)
        : getRawIpFromRequest(req)
      return `${routeName}-${uniqueId}`
    },
    window: opts.window ? opts.window : 60,
    limit: opts.limit ? opts.limit : 3,
  })
}

export function basicUserDebounce(path: string) {
  return debounceMiddleware(path, (req: Request) => req.user?.id, {
    window: 3,
    limit: 1,
  })
}

/**
 * @param routeName the key to use for rate limiting
 * @param window # of seconds in a window
 * @param limit number of events in that
 * For example, 3 events per 5 seconds
 */
export const ipThrottleMiddleware = (
  routeName: string,
  window = 1,
  limit = 1,
) => {
  return rateLimiter.middleware({
    redis: redisCache,
    key: req => {
      const ip = getRawIpFromRequest(req)
      const array = ip.split('.')
      const identifier = req.user ? req.user.id : `${array[0]}-${array[1]}`
      return `${routeName}-${identifier}`
    },
    window,
    limit,
  })
}
