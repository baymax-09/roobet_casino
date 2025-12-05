import { GraphQLError } from 'graphql'
import { mutationField, nonNull, inputObjectType } from 'nexus'

import { addNoteToUser } from 'src/modules/admin/documents/user_notes'
import { getUserCount } from 'src/modules/user'
import { createScheduledEvent } from 'src/util/eventScheduler'
import { BasicCache } from 'src/util/redisModels'

import {
  MESSAGING_CACHE_KEY_ALL,
  MESSAGING_CACHE_NAME,
} from 'src/modules/messaging/constants'
import {
  type Message,
  getMessage,
  updateMessage,
} from 'src/modules/messaging/messages/documents/message'
import { type EmitScheduledMessageParams } from 'src/modules/messaging/messages/workers/emitScheduledMessage'
import { EMIT_SCHEDULED_MESSAGE_TOPIC } from 'src/modules/messaging/messages/workers/emitScheduledMessage'

const scheduleMessageEvent = async (message: Message) => {
  const sendAt = message.liveAt ?? new Date()

  const eventId = await createScheduledEvent<EmitScheduledMessageParams>(
    EMIT_SCHEDULED_MESSAGE_TOPIC,
    sendAt,
    {
      messageId: message._id.toString(),
    },
  )

  // Update message document separately to prevent a race condition in the consumer.
  await updateMessage(message._id.toString(), {
    $set: { 'meta.scheduledEmitEventId': eventId },
  })
}

const MessageSendInput = inputObjectType({
  name: 'MessageSendInput',
  definition(type) {
    type.nonNull.id('id')
    type.date('liveAt')
  },
})

export const MessageSendMutationField = mutationField('messageSend', {
  description: 'Send a message document.',
  type: 'MessageDetailed',
  args: {
    data: nonNull(MessageSendInput),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'messaging', action: 'update' }],
  },
  resolve: async (_, { data: { id, liveAt } }, context) => {
    // The admin user making the request.
    if (!context.user) {
      return null
    }

    if (liveAt && liveAt < new Date()) {
      throw new GraphQLError('A message cannot be sent in the past.', {})
    }

    const message = await getMessage(id)

    if (!message) {
      return null
    }

    // Message has already been sent.
    if (message.live) {
      throw new GraphQLError('This message has already been sent', {})
    }

    if (!message.recipients) {
      throw new GraphQLError('This message has no recipients.', {})
    }

    if (message.recipients.length === 0) {
      await BasicCache.invalidate(MESSAGING_CACHE_NAME, MESSAGING_CACHE_KEY_ALL)
    }

    if (message.recipients.length > 1000) {
      throw new GraphQLError(
        'This message has more than 1000 recipients. Cannot send a message to that many users.',
        {},
      )
    }

    // Calculate number of current users.
    const recipientCount =
      message.recipients.length > 0
        ? message.recipients.length
        : await getUserCount()

    // Update database record.
    const result = await updateMessage(id, {
      recipientCount,
      live: true,
      liveAt: liveAt ?? new Date(),
    })

    if (!result) {
      return null
    }

    // Add a new note to every user when sending to a specified list.
    if (result?.recipients && result?.recipients.length > 0) {
      for (const userId of result.recipients) {
        // We aren't awaiting this... this needs to be move to a queue eventually.
        addNoteToUser(
          userId,
          context.user,
          `Marketing message '${message.title}' sent to user.`,
        )
      }
    }

    // Schedule send new message websocket message.
    await scheduleMessageEvent(result)

    return result
  },
})
