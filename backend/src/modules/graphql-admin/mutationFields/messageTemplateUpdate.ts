import { mutationField, nonNull, inputObjectType } from 'nexus'

import { updateMessageTemplate } from 'src/modules/messaging/messages/documents'

const MessageTemplateUpdateInput = inputObjectType({
  name: 'MessageTemplateUpdateInput',
  definition(type) {
    type.nonNull.id('id')
    type.string('name')
    type.string('title')
    type.string('body')
    type.string('heroImage')
  },
})

export const MessageTemplateUpdateMutationField = mutationField(
  'messageTemplateUpdate',
  {
    description: 'Update specific message template document.',
    type: 'MessageTemplate',
    args: {
      data: nonNull(MessageTemplateUpdateInput),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'messaging', action: 'update' }],
    },
    resolve: async (_, { data: { id, ...updates } }) => {
      return await updateMessageTemplate(id, {
        name: updates.name ?? undefined,
        title: updates.title ?? undefined,
        body: updates.body ?? undefined,
        heroImage: updates.heroImage ?? undefined,
      })
    },
  },
)
