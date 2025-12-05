import { mutationField, inputObjectType, nonNull } from 'nexus'

import { markMessagesAsRead } from 'src/modules/messaging/messages/documents'

const MessageMarkAsReadInput = inputObjectType({
  name: 'MessageMarkAsReadInput',
  definition(type) {
    type.list.nonNull.objectId('id')
  },
})

export const MessageMarkAsReadMutationField = mutationField(
  'messageMarkAsRead',
  {
    description: 'Mark specific message as read.',
    type: 'Success',
    args: {
      data: nonNull(MessageMarkAsReadInput),
    },
    auth: {
      authenticated: true,
    },
    resolve: async (_, { data: { id } }, { user }) => {
      if (!user?.id) {
        return null
      }

      await markMessagesAsRead(user.id, id)

      return { success: true }
    },
  },
)
