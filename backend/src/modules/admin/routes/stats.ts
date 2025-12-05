import { Router } from 'express'
import moment from 'moment'

import { config } from 'src/system'
import { api } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { getUserCount } from 'src/modules/user'
import {
  getStatsDaysBack,
  getStatsBetweenDays,
} from 'src/modules/stats/documents/stats'
import { media } from 'src/util/media'
import { runReport } from 'src/modules/stats/reporting/lib'

import { roleCheck } from '../middleware'

export function createStatsRouter() {
  const router = Router()

  router.get(
    '/userCount',
    ...roleCheck([{ resource: 'reports', action: 'read' }]),
    api.validatedApiCall(async () => {
      return {
        totalUsers: await getUserCount(),
      }
    }),
  )

  router.get(
    '/getStatsDateRange',
    ...roleCheck([{ resource: 'global_stats', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      if (
        typeof req.query.startDate !== 'string' ||
        typeof req.query.endDate !== 'string'
      ) {
        throw new APIValidationError('api__missing_param', [
          'startDate/endDate',
        ])
      }

      const startDate = moment
        .tz(moment(req.query.startDate), 'America/Chicago')
        .format('YYYY-MM-DD')
      const endDate = moment
        .tz(moment(req.query.endDate), 'America/Chicago')
        .format('YYYY-MM-DD')

      const statsList = await getStatsBetweenDays(startDate, endDate)

      const [today, yesterday] = await getStatsDaysBack(2)

      const payload = {
        today,
        yesterday,
        statsList: statsList.reverse(),
      }

      res.json(payload)
    }),
  )

  router.get(
    '/dailyStatsForUser',
    ...roleCheck([{ resource: 'stats', action: 'read' }]),
    api.validatedApiCall(async req => {
      if (
        typeof req.query.startDate !== 'string' ||
        typeof req.query.endDate !== 'string'
      ) {
        throw new APIValidationError('api__missing_param', [
          'startDate/endDate',
        ])
      }
      const startDate = moment(req.query.startDate).startOf('day').toISOString()
      const endDate = moment(req.query.endDate).endOf('day').toISOString()
      const userId = req.query.userId
      if (typeof userId !== 'string') {
        throw new APIValidationError('api__missing_param', ['userId'])
      }

      const { result } = await runReport('dailyStatsForUser', {
        startDate,
        endDate,
        userId,
      })

      return await result
    }),
  )

  router.post(
    '/massUploadUserReport',
    ...roleCheck([{ resource: 'reports', action: 'create' }]),
    api.validatedApiCall(async req => {
      req.setTimeout(1000 * 60 * 2)

      const { data } = req.body

      const { result } = await runReport('massUploadUser', { data })

      return await result
    }),
  )

  router.get(
    '/reportDownload',
    ...roleCheck([{ resource: 'reports', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      if (
        config.isProd &&
        req.query.token !== config.reporting.userExportToken
      ) {
        return false
      }

      const { reportName } = req.query

      if (!reportName || typeof reportName !== 'string') {
        throw new APIValidationError('api__missing_param', ['reportName'])
      }

      const parsedReportName = decodeURIComponent(reportName)

      if (typeof parsedReportName !== 'string') {
        throw new APIValidationError('api__invalid_param', ['reportName'])
      }

      const sheet = await media.download({
        dest: 'adminReports',
        path: `${parsedReportName}.csv`,
      })

      res.attachment(`${parsedReportName}.csv`)
      res.status(200).send(sheet)
    }),
  )

  return router
}
