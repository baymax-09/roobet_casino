import { type Options } from 'amqplib'

import { getCurrentDateTimeISO } from 'src/util/helpers/time'
import { getUserOrigin } from 'src/util/helpers/userOrigin'

import { publishAndLogMessage } from '../utils'

export const publishUserConsentMessageToFastTrack = async (
  userId: string,
  messageOptions?: Options.Publish,
) => {
  const messagePayload = {
    user_id: userId,
    timestamp: getCurrentDateTimeISO(),
    origin: getUserOrigin(userId),
  }

  const options = {
    ...messageOptions,
    type: 'USER_CONSENTS_V2',
    persistent: true,
    headers: { cc: 'fasttrack' },
  }

  await publishAndLogMessage(
    'events.userConsent',
    messagePayload,
    options,
    userId,
  )
}
