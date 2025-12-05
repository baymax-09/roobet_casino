import { mutationField, nonNull, inputObjectType } from 'nexus'

import { softDeleteMessageTemplate } from 'src/modules/messaging/messages/documents'

const MessageTemplateDeleteInput = inputObjectType({
  name: 'MessageTemplateDeleteInput',
  definition(type) {
    type.nonNull.id('id')
  },
})

export const MessageTemplateDeleteMutationField = mutationField(
  'messageTemplateDelete',
  {
    description: 'Soft-delete a specific message template document.',
    type: 'MessageTemplate',
    args: {
      data: nonNull(MessageTemplateDeleteInput),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'messaging', action: 'delete' }],
    },
    resolve: async (_, { data }) => {
      return await softDeleteMessageTemplate(data.id)
    },
  },
)
