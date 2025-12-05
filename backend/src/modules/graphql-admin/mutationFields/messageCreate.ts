import { mutationField, nonNull, inputObjectType } from 'nexus'
import { GraphQLError } from 'graphql'

import { createMessage } from 'src/modules/messaging/messages/documents'
import { getRecipientsByNameOrId } from 'src/modules/messaging/messages/lib'

const MessageCreateInput = inputObjectType({
  name: 'MessageCreateInput',
  definition(type) {
    type.nonNull.list.nonNull.string('recipients')
    type.nonNull.string('title')
    type.nonNull.string('body')
    type.string('heroImage')
    type.string('logoImage')
    type.string('featuredImage')
    type.string('link')
  },
})

export const MessageCreateMutationField = mutationField('messageCreate', {
  description: 'Create a message document.',
  type: 'MessageDetailed',
  args: {
    data: nonNull(MessageCreateInput),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'messaging', action: 'create' }],
  },
  resolve: async (_, { data }) => {
    if (data.recipients.length > 1000) {
      throw new GraphQLError(
        'This message has more than 1000 recipients. Cannot send a message to that many users.',
        {},
      )
    }

    // Parse recipients into a list of IDs.
    const recipients = await getRecipientsByNameOrId(data.recipients)

    return await createMessage({
      live: false,
      liveAt: null,
      title: data.title,
      body: data.body,
      link: data.link ?? null,
      recipients: recipients ?? null,
      heroImage: data.heroImage ?? null,
      logoImage: data.logoImage ?? null,
      featuredImage: data.featuredImage ?? null,
    })
  },
})
