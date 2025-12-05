import { type RequestHandler } from 'express'

/**
 * High level express middleware for re-writing Host header on incoming requests.
 *
 * Our API has historically be served from an api.{domain} zone, but is being
 * migrated to {domain}/_api. In order to calculate redirects correctly, we must
 * update the Host header to the expected value.
 *
 * The X-Roobet-Host header is being attached to the request by HAProxy locally, and
 * at the edge (Cloudflare Worker) on hosted environments.
 *
 * See URL helpers in src/system/config.ts for usages of the Host header.
 */
export const hostMiddleware: RequestHandler = (req, _, next) => {
  const hostHeader = req.headers['x-roobet-host']

  if (typeof hostHeader === 'string') {
    req.headers.host = hostHeader
    req.context = {
      ...(req.context ?? {}),
      apiRewrite: true,
    }
  }

  next()
}
