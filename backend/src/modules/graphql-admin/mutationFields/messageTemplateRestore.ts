import { mutationField, nonNull, inputObjectType } from 'nexus'

import { restoreMessageTemplate } from 'src/modules/messaging/messages/documents'

const MessageTemplateRestoreInput = inputObjectType({
  name: 'MessageTemplateRestoreInput',
  definition(type) {
    type.nonNull.id('id')
  },
})

export const MessageTemplateRestoreMutationField = mutationField(
  'messageTemplateRestore',
  {
    description: 'Restore a specific message template document.',
    type: 'MessageTemplate',
    args: {
      data: nonNull(MessageTemplateRestoreInput),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'messaging', action: 'update' }],
    },
    resolve: async (_, { data }) => {
      return await restoreMessageTemplate(data.id)
    },
  },
)
