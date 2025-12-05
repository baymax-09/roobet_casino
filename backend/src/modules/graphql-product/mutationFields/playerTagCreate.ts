import { mutationField, nonNull, inputObjectType } from 'nexus'
import { GraphQLError } from 'graphql'

import {
  canPlayerCreateTag,
  createPlayerTag,
  getPlayerTag,
} from 'src/modules/tagging/documents/playerTag'

import { PlayerTagType } from '../types/playerTag'

const PlayerTagCreateInput = inputObjectType({
  name: 'PlayerTagCreateInput',
  definition(type) {
    type.nonNull.string('tagId', {
      description: 'Tag ID to add.',
      auth: null,
    })
  },
})

export const PlayerTagCreateMutationField = mutationField('playerTagCreate', {
  description: 'Create a player tag.',
  type: PlayerTagType,
  args: { data: nonNull(PlayerTagCreateInput) },
  auth: {
    authenticated: true,
  },
  resolve: async (_, { data }, { user }) => {
    const { tagId } = data

    if (!user?.id) {
      throw new GraphQLError('user__invalid_id', {})
    }

    const existingTag = await getPlayerTag(user.id, tagId)

    if (existingTag) {
      return existingTag
    }

    const lastUpdatedTag = await canPlayerCreateTag(user.id)
    if (lastUpdatedTag) {
      throw new GraphQLError('slow_down')
    }

    const playerTag = await createPlayerTag(user.id, tagId)
    return playerTag
  },
})
