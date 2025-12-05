import { type Request, type Response, type NextFunction } from 'express'
import { type RoobetReq, api } from 'src/util/api'
import { getFrontendBase } from 'src/modules/auth/lib/oauth'
import { ouroborosPath } from '../lib/helpers'

// Custom invocation of api.check with a callback to handle unauthenticated
// rather than returning 401 and ending the cycle.
export const uniboAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  api.check(req, res, next, {}, user => {
    if (!user) {
      res.status(500)
      res.statusMessage = 'Unauthorized'
    }
    next()
  })
}

// Custom middleware to catch unauthenticated user and redirect to login
// with a follow up redirect back to this route.
export const uniboRedirectMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { user } = req as RoobetReq
  if (!user && res.statusCode === 500 && res.statusMessage === 'Unauthorized') {
    const cyclicalRedirectUrl = `${getFrontendBase(
      req,
    )}?modal=auth&tab=login&redirect_url=${ouroborosPath(req)}`
    res.redirect(cyclicalRedirectUrl)
    return
  }

  next()
}
