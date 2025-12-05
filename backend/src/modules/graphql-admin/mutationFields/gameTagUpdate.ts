import { mutationField, nonNull, inputObjectType } from 'nexus'

import { addSystemTimezone } from 'src/util/helpers/time'

import { updateTag } from 'src/modules/tp-games/documents/gameTags'
import { updateGames, updateGame } from 'src/modules/tp-games/documents/games'

export const GameTagUpdateInput = inputObjectType({
  name: 'GameTagUpdateInput',
  definition(type) {
    type.nonNull.id('id')
    type.nonNull.string('title')
    type.nonNull.string('slug')
    type.boolean('enabled')
    type.boolean('excludeFromTags')
    type.string('startDate')
    type.string('endDate')
    type.int('order')
    type.list.string('gameIds')
    type.int('pageSize')
    type.boolean('showOnHomepage')
  },
})

export const GameTagUpdateMutationField = mutationField('gameTagUpdate', {
  description: 'Update a Game Tag',
  type: 'GameTag',
  args: { data: nonNull(GameTagUpdateInput) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'tpgametags', action: 'update' }],
  },
  resolve: async (_, { data }) => {
    const { id, gameIds, startDate, endDate } = data
    const correctedStartDate = startDate ? addSystemTimezone(startDate) : null
    const correctedEndDate = endDate ? addSystemTimezone(endDate) : null
    if (gameIds?.length) {
      await updateGames({}, { $pull: { tags: id } })
      await updateGames({ _id: { $in: gameIds } }, { $push: { tags: id } })
      await Promise.all(
        gameIds.map(async (gameId, priority) => {
          const path = `tagPriorities.${id}`
          await updateGame({ _id: gameId }, { $set: { [path]: priority + 1 } })
        }),
      )
    }
    return await updateTag(id, {
      ...data,
      startDate: correctedStartDate,
      endDate: correctedEndDate,
    })
  },
})
