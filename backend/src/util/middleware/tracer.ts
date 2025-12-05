import { type RequestHandler } from 'express'
import tracer from 'dd-trace'
import tags from 'dd-trace/ext/tags'
import url from 'url'

export const tracerMiddleware: RequestHandler = (req, res, next) => {
  const headers = req.headers

  const span = tracer.scope().active()
  if (span) {
    span.addTags(headers)

    const path = new url.URL(
      req.originalUrl,
      req.protocol + '://' + req.hostname,
    ).pathname
    if (['/metrics', '/health'].includes(path)) {
      span.setTag(tags.MANUAL_DROP, true)
    }

    if (res.statusCode >= 400) {
      span.setTag(tags.MANUAL_KEEP, true)
    }
  }

  next()
}
