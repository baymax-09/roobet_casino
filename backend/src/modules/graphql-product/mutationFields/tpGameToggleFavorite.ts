import {
  mutationField,
  stringArg,
  nonNull,
  booleanArg,
  objectType,
} from 'nexus'

import { getUserById } from 'src/modules/user'

import { TPFavorites } from 'src/modules/tp-games/documents'
import { GraphQLError } from 'graphql'

const TPGameToggleMutationFieldData = objectType({
  name: 'GameToggleFavoritePayload',
  definition: type => {
    type.nonNull.field('user', {
      auth: {
        authenticated: true,
      },
      type: 'User',
    })
  },
})

export const TPGameToggleFavoriteMutationField = mutationField(
  'gameToggleFavorite',
  {
    description: "Toggle a game in user's favorite games.",
    type: TPGameToggleMutationFieldData,
    args: {
      gameIdentifier: nonNull(stringArg()),
      isFavorite: nonNull(booleanArg()),
    },
    auth: {
      authenticated: true,
    },
    resolve: async (_, { gameIdentifier, isFavorite }, { user }) => {
      if (!user) {
        throw new GraphQLError('Unknown user.')
      }

      if (isFavorite) {
        await TPFavorites.addFavorite(
          { userId: user.id, identifier: gameIdentifier },
          {},
        )
      } else {
        await TPFavorites.removeFavorite({
          userId: user.id,
          identifier: gameIdentifier,
        })
      }

      const updatedUser = await getUserById(user.id)
      if (!updatedUser) {
        throw new GraphQLError('Unknown user.')
      }

      return {
        user: updatedUser,
      }
    },
  },
)
