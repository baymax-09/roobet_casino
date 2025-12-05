import { type Options } from 'amqplib'

import { getCurrentDateTimeISO } from 'src/util/helpers/time'
import { getUserOrigin } from 'src/util/helpers/userOrigin'

import { publishAndLogMessage } from '../utils'

interface HandleUserLoginArgs {
  userId: string
  user_agent: string | undefined
  ip_address: string
}

export const publishUserLoginMessageToFastTrack = async (
  message: HandleUserLoginArgs,
  messageOptions?: Options.Publish,
) => {
  const { userId, user_agent, ip_address } = message
  const messagePayload = {
    user_id: userId,
    is_impersonated: false,
    user_agent,
    ip_address,
    timestamp: getCurrentDateTimeISO(),
    origin: getUserOrigin(userId),
  }

  const options = {
    ...messageOptions,
    type: 'LOGIN_V2',
    persistent: true,
    headers: { cc: 'fasttrack' },
  }

  await publishAndLogMessage(
    'events.userLogin',
    messagePayload,
    options,
    userId,
  )
}
