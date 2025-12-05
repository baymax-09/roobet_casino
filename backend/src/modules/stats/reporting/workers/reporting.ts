import shortid from 'shortid'

import { config } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import { media } from 'src/util/media'
import {
  sendAdminReportSuccessEmail,
  sendAdminReportFailureEmail,
} from 'src/vendors/mailgun'
import { createConsumer } from 'src/util/rabbitmq/lib/eventConsumer'

import { type REPORTS, runReport } from '../lib'
import { type Reports, type ReportParams } from '../lib/api'
import { reportingLogger } from '../lib/logger'

interface ReportJob<R extends Reports> {
  report: keyof R
  params: ReportParams
  requestingUserId?: string
  requestedTimestamp: string
}

const handler = async ({
  report,
  params,
  requestedTimestamp,
  requestingUserId,
}: ReportJob<typeof REPORTS>) => {
  const reportName = `${report}-${requestedTimestamp}-${shortid.generate()}`
  const logger = reportingLogger('handler', {
    userId: requestingUserId ?? null,
  })
  logger.info('Running report', { report })

  try {
    const { result: contents, definition } = await runReport(report, params)

    // TODO remove this once report generator interface is more solid
    if (typeof contents !== 'string') {
      return
    }

    logger.info('Finished running report.', { report })

    await media.upload({
      dest: 'adminReports',
      path: `${reportName}.csv`,
      contents,
    })

    const urlParams = new URLSearchParams({
      reportName,
    })

    const reportLink = `${config.appSettings.backendBase}/admin/stats/reportDownload?${urlParams}`

    logger.info('Uploaded report to adminReports bucket.', {
      reportLink,
      report,
    })

    await definition.afterRun?.(params, contents)

    // Send email if requesting user id was provided.
    if (requestingUserId) {
      await sendAdminReportSuccessEmail(
        requestingUserId,
        reportName,
        reportLink,
      )

      logger.info('Sent report success email', {
        report,
        reportName,
        reportLink,
      })
    }
  } catch (error) {
    logger.error('Reporting worker', {}, error)

    // Send email if requesting user id was provided.
    if (requestingUserId) {
      await sendAdminReportFailureEmail(requestingUserId, reportName)
      logger.info('Sentreport error email.', { report })
    }
  }
}

const start = async () => {
  await createConsumer({
    exchangeName: 'events',
    routingKey: 'events.reports',
    queue: 'reports',
    handler,
  })
}

export async function run() {
  runWorker('reporting', start)
}
