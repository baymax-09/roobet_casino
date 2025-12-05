import { mutationField, nonNull, inputObjectType } from 'nexus'

import { restoreMessage } from 'src/modules/messaging/messages/documents'

const MessageRestoreInput = inputObjectType({
  name: 'MessageRestoreInput',
  definition(type) {
    type.nonNull.id('id')
  },
})

export const MessageRestoreMutationField = mutationField('messageRestore', {
  description: 'Restore a specific message document.',
  type: 'MessageDetailed',
  args: {
    data: nonNull(MessageRestoreInput),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'messaging', action: 'update' }],
  },
  resolve: async (_, { data }) => {
    return await restoreMessage(data.id)
  },
})
