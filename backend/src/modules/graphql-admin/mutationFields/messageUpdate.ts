import { mutationField, inputObjectType, nonNull } from 'nexus'
import { GraphQLError } from 'graphql'

import {
  getMessage,
  updateMessage,
} from 'src/modules/messaging/messages/documents'
import { getRecipientsByNameOrId } from 'src/modules/messaging/messages/lib'

const MessageUpdateInput = inputObjectType({
  name: 'MessageUpdateInput',
  definition(type) {
    type.nonNull.id('id')
    type.list.nonNull.string('recipients')
    type.string('title')
    type.string('body')
    type.string('heroImage')
    type.string('logoImage')
    type.string('featuredImage')
    type.string('link')
  },
})

export const MessageUpdateMutationField = mutationField('messageUpdate', {
  description: 'Update specific message document.',
  type: 'MessageDetailed',
  args: {
    data: nonNull(MessageUpdateInput),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'messaging', action: 'update' }],
  },
  resolve: async (_, { data: { id, ...updates } }) => {
    const message = await getMessage(id)

    if (!message) {
      return null
    }

    if (message.live) {
      throw new GraphQLError(
        'This message has already been sent, it cannot be updated.',
        {},
      )
    }

    // Parse recipients into a list of IDs.
    const recipients = await getRecipientsByNameOrId(updates.recipients)

    return await updateMessage(id, {
      recipients,
      title: updates.title ?? undefined,
      body: updates.body ?? undefined,
      heroImage: updates.heroImage ?? undefined,
      logoImage: updates.logoImage ?? undefined,
      featuredImage: updates.featuredImage ?? undefined,
      link: updates.link ?? undefined,
    })
  },
})
