import { queryField, stringArg, nonNull } from 'nexus'
import { GraphQLError } from 'graphql'

import { getGame } from 'src/modules/tp-games/documents/games'
import { isDisabled } from 'src/modules/tp-games/documents/blocks'

export const TPGameAdminQueryField = queryField('tpGameAdmin', {
  type: 'TPGameAdmin',
  description: 'Get a single TPGame by identifier',
  args: {
    gameIdentifier: nonNull(stringArg()),
    type: stringArg(),
  },
  auth: {
    authenticated: false,
  },

  resolve: async (_, { gameIdentifier, type }, { user }) => {
    const game = await getGame({
      identifier: gameIdentifier,
      ...(type && { devices: type }),
    })

    if (!game) {
      throw new GraphQLError('game__does_not_exist')
    }

    const disabled = await isDisabled(game, user)
    if (disabled) {
      throw new GraphQLError('game__disabled')
    }

    return game
  },
})
