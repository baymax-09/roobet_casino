import { datadogLogs, type StatusType } from '@datadog/browser-logs'

import { env } from 'common/constants'

export const logEvent = (
  message: string,
  messageContext?: object | undefined,
  status?: StatusType | undefined,
  error?: Error | undefined,
) => {
  if (env.NODE_ENV === 'production') {
    return datadogLogs.logger.log(message, messageContext, status, error)
  }
}
