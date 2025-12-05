import { type Options } from 'amqplib'

import { getCurrentDateTimeISO } from 'src/util/helpers/time'
import { getUserOrigin } from 'src/util/helpers/userOrigin'
import { getIpFromRequest } from 'src/modules/fraud/geofencing'

import { type CustomEventPayload } from './../types/customEvent'
import { publishAndLogMessage } from '../utils'

export async function publishCustomFastTrackEvent(
  payload: CustomEventPayload,
  messageOptions?: Options.Publish,
) {
  const { userId, request, notificationType, data } = payload

  const messagePayload = {
    notification_type: notificationType,
    user_id: userId,
    origin: getUserOrigin(userId),
    ipAddress: await getIpFromRequest(request),
    userAgent: request.useragent?.source,
    timestamp: getCurrentDateTimeISO(),
    data,
  }

  const options = {
    ...messageOptions,
    type: 'CUSTOM',
    persistent: true,
    headers: { cc: 'fasttrack' },
  }

  await publishAndLogMessage(
    'events.customFasttrack',
    messagePayload,
    options,
    userId,
  )
}
