import { queryField, idArg, nonNull } from 'nexus'

import { getMessage } from 'src/modules/messaging/messages/documents'

export const MessageQueryField = queryField('message', {
  type: 'MessageDetailed',
  args: { id: nonNull(idArg()) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'messaging', action: 'read' }],
  },
  resolve: async (_, args) => await getMessage(args.id),
})
