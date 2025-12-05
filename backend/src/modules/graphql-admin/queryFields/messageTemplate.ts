import { queryField, idArg, nonNull } from 'nexus'

import { getMessageTemplate } from 'src/modules/messaging/messages/documents'

export const MessageTemplateQueryField = queryField('messageTemplate', {
  type: 'MessageTemplate',
  args: { id: nonNull(idArg()) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'messaging', action: 'read' }],
  },
  resolve: async (_, args) => await getMessageTemplate(args.id),
})
