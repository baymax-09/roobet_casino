import { mutationField, nonNull, inputObjectType } from 'nexus'

import { io } from 'src/system'
import { BasicCache } from 'src/util/redisModels'

import {
  MESSAGING_CACHE_KEY_ALL,
  MESSAGING_CACHE_NAME,
} from 'src/modules/messaging/constants'
import { IO_MESSAGE_UNSEND } from 'src/modules/messaging/messages/constants'
import {
  getMessage,
  softDeleteMessage,
} from 'src/modules/messaging/messages/documents'

const MessageDeleteInput = inputObjectType({
  name: 'MessageDeleteInput',
  definition(type) {
    type.nonNull.id('id')
  },
})

export const MessageDeleteMutationField = mutationField('messageDelete', {
  description: 'Soft-delete a specific message document.',
  type: 'MessageDetailed',
  args: {
    data: nonNull(MessageDeleteInput),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'messaging', action: 'delete' }],
  },
  resolve: async (_, { data }) => {
    const message = await getMessage(data.id)

    if (!message) {
      return null
    }

    if (message.live) {
      // this message is being "un-sent"
      await BasicCache.invalidate(MESSAGING_CACHE_NAME, MESSAGING_CACHE_KEY_ALL)

      if (message.recipients && message.recipients.length > 0) {
        // Emit to only receipients.
        for (const userId of message.recipients) {
          io.to(userId).emit(IO_MESSAGE_UNSEND)
        }
      } else {
        // Emit to all open connections.
        io.emit(IO_MESSAGE_UNSEND)
      }
    }

    return await softDeleteMessage(data.id)
  },
})
