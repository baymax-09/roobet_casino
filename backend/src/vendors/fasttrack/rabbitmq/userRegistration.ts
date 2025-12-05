import { type Options } from 'amqplib'

import { getCurrentDateTimeISO } from 'src/util/helpers/time'
import { getUserOrigin } from 'src/util/helpers/userOrigin'

import { publishAndLogMessage } from '../utils'

interface HandleUserSignUpArgs {
  userId: string
  url_referer: string | undefined
  user_agent: string | undefined
  ip_address: string
}

export const publishUserSignUpMessageToFastTrack = async (
  message: HandleUserSignUpArgs,
  messageOptions?: Options.Publish,
) => {
  const { userId, url_referer, user_agent, ip_address } = message
  const messagePayload = {
    user_id: userId,
    url_referer,
    note: '',
    user_agent,
    ip_address,
    timestamp: getCurrentDateTimeISO(),
    origin: getUserOrigin(userId),
  }

  const options = {
    ...messageOptions,
    type: 'USER_CREATE_V2',
    persistent: true,
    headers: { cc: 'fasttrack' },
  }

  await publishAndLogMessage(
    'events.userSignUp',
    messagePayload,
    options,
    userId,
  )
}
