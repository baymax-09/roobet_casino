import { queryField, list, booleanArg, nonNull } from 'nexus'

import { getMessageTemplates } from 'src/modules/messaging/messages/documents'

export const MessageTemplatesQueryField = queryField('messageTemplates', {
  type: list('MessageTemplate'),
  args: {
    deleted: nonNull(
      booleanArg({
        default: false,
      }),
    ),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'messaging', action: 'read' }],
  },
  resolve: async (_, args) =>
    await getMessageTemplates({
      deleted: args.deleted,
    }),
})
