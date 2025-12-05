import * as Prometheus from 'prom-client'
import expressProm from 'express-prom-bundle'
import net from 'net'
import url from 'url'

export const metricsMiddleware = expressProm({
  includePath: true,
  includeMethod: true,
  autoregister: false,
  customLabels: { host: null, zone_name: null },
  transformLabels: function (labels, req) {
    let path = req.route?.path ? req.baseUrl + req.route?.path : req.originalUrl
    const uuidRegex =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

    const hasPattern = uuidRegex.test(path)

    if (hasPattern) {
      path = path.replace(uuidRegex, ':uuid')
    }

    labels.path = /OPTIONS/i.test(req.method)
      ? '__options'
      : new url.URL(path, req.protocol + '://' + req.hostname).pathname

    if (!net.isIP(req.hostname)) {
      labels.host = req.hostname
      labels.zone_name = req.hostname.split('.').slice(-2).join('.')
    }
  },
})

Prometheus.collectDefaultMetrics()
