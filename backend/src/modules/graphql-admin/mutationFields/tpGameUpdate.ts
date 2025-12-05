import { GraphQLError } from 'graphql'
import { inputObjectType, mutationField, arg, stringArg, nonNull } from 'nexus'

import {
  getGame,
  updateGame,
  updateGameCategories,
} from 'src/modules/tp-games/documents/games'

const TPGameUpdateInputType = inputObjectType({
  name: 'UpdateTPGameInputType',
  definition(type) {
    type.nonNull.string('releasedAt')
    type.field('approvalStatus', {
      type: 'TPGameApprovalStatusEnumType',
      auth: null,
    })
    type.list.string('tags')
    type.string('title')
    type.string('squareImage')
    type.string('description')
    type.string('provider')
    type.string('category')
    type.positiveFloat('payout')
  },
})

export const TPGameUpdateMutationField = mutationField('updateTPGame', {
  type: 'TPGameAdmin',
  description: "Update a TP Game to User's favorite",
  args: {
    gameIdentifier: nonNull(
      stringArg({
        description: 'Used to identify the game you wish to update',
      }),
    ),
    input: nonNull(arg({ type: TPGameUpdateInputType })),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'tpgames', action: 'update' }],
  },
  async resolve(_, { gameIdentifier, input }) {
    const game = await getGame({ identifier: gameIdentifier })

    if (!game) {
      throw new GraphQLError(
        `Could not load tp-game with identifier ${gameIdentifier}.`,
      )
    }
    const updated = await updateGame({ identifier: gameIdentifier }, input)
    return updated
  },
})

const TPGameCategoryUpdateInput = inputObjectType({
  name: 'TPGameCategoryUpdateInput',
  definition(type) {
    type.nonNull.list.nonNull.string('addedGames')
    type.nonNull.list.nonNull.string('removedGames')
    type.nonNull.string('category')
  },
})

export const TPGameCategoryUpdateMutationField = mutationField(
  'tpGameCategoryUpdate',
  {
    type: 'Boolean',
    description: 'Update category for multiple TP Games',
    args: {
      input: nonNull(arg({ type: TPGameCategoryUpdateInput })),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'tpgames', action: 'update' }],
    },
    async resolve(_, { input }) {
      const { addedGames, removedGames, category } = input

      try {
        // Update games in batch
        await updateGameCategories(addedGames, category, removedGames)

        return true
      } catch (error) {
        throw new GraphQLError(`Error updating categories: ${error.message}`)
      }
    },
  },
)
