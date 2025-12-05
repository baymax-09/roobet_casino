import { Router } from 'express'

import { isValidReport } from 'src/modules/stats/reporting/lib'
import { config } from 'src/system'
import { api } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { publishReportEvent } from 'src/modules/stats/reporting/rabbitmq'

/**
 * Routes specific to running reports.
 *
 * NOTE: This router does not apply the api.check middleware by default.
 */
export const createReportingRouter = () => {
  const router = Router()

  router.post(
    '/webhook',
    api.validatedApiCall(async (req, res) => {
      if (
        config.isProd &&
        req.query.token !== config.reporting.userExportToken
      ) {
        return false
      }

      const { report, params } = req.body

      if (!report || !isValidReport(report)) {
        throw new APIValidationError('Invalid report type.')
      }

      if (typeof params !== 'object') {
        throw new APIValidationError('Invalid params supplied.')
      }

      await publishReportEvent({ report, params })

      res.send()
    }),
  )

  return router
}
