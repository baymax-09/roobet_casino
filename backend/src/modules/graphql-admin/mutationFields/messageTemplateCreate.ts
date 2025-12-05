import { mutationField, nonNull, inputObjectType } from 'nexus'

import { createMessageTemplate } from 'src/modules/messaging/messages/documents'

const MessageTemplateCreateInput = inputObjectType({
  name: 'MessageTemplateCreateInput',
  definition(type) {
    type.nonNull.string('name')
    type.nonNull.string('title')
    type.nonNull.string('body')
    type.nonNull.string('heroImage')
  },
})

export const MessageTemplateCreateMutationField = mutationField(
  'messageTemplateCreate',
  {
    description: 'Create a message template document.',
    type: 'MessageTemplate',
    args: {
      data: nonNull(MessageTemplateCreateInput),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'messaging', action: 'create' }],
    },
    resolve: async (_, { data }) => {
      return await createMessageTemplate(data)
    },
  },
)
