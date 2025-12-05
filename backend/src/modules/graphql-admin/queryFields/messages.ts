import { queryField, list, nonNull, booleanArg } from 'nexus'

import { getMessages } from 'src/modules/messaging/messages/documents'

export const MessagesQueryField = queryField('messages', {
  type: list('MessageDetailed'),
  args: {
    live: nonNull('Boolean'),
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
    await getMessages({
      live: args.live,
      deleted: args.deleted,
    }),
})
