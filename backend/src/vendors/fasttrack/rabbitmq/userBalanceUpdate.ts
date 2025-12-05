import { type Options } from 'amqplib'

import { getCurrentDateTimeISO } from 'src/util/helpers/time'
import { getUserOrigin } from 'src/util/helpers/userOrigin'

import { type BalanceUpdate } from '../types'
import { publishAndLogMessage } from '../utils'

export interface HandleUserUpdateArgs {
  userId: string
  balances: BalanceUpdate[]
}

export const publishUserBalanceUpdateMessageToFastTrack = async (
  message: HandleUserUpdateArgs,
  messageOptions?: Options.Publish,
) => {
  const { userId, balances } = message
  const messagePayload = {
    balances,
    origin: getUserOrigin(userId),
    timestamp: getCurrentDateTimeISO(),
    user_id: userId,
  }

  const options = {
    ...messageOptions,
    type: 'USER_BALANCES_UPDATE',
    persistent: true,
    headers: { cc: 'fasttrack' },
  }

  await publishAndLogMessage(
    'events.userBalanceUpdate',
    messagePayload,
    options,
    userId,
  )
}
