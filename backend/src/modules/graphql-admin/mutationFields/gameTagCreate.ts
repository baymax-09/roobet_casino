import { mutationField, nonNull, inputObjectType } from 'nexus'

import { addSystemTimezone } from 'src/util/helpers/time'

import { createTag } from 'src/modules/tp-games/documents/gameTags'
import { updateGames, updateGame } from 'src/modules/tp-games/documents/games'

const GameTagCreateInput = inputObjectType({
  name: 'GameTagCreateInput',
  definition(type) {
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

export const GameTagCreateMutationField = mutationField('gameTagCreate', {
  description: 'Create a Game Tag',
  type: 'GameTag',
  args: { data: nonNull(GameTagCreateInput) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'tpgametags', action: 'create' }],
  },
  resolve: async (_, { data }) => {
    const { gameIds, startDate, endDate, ...tag } = data
    const correctedStartDate = startDate ? addSystemTimezone(startDate) : null
    const correctedEndDate = endDate ? addSystemTimezone(endDate) : null
    const tagData = await createTag({
      ...tag,
      startDate: correctedStartDate,
      endDate: correctedEndDate,
    })
    if (gameIds?.length) {
      await updateGames(
        { _id: { $in: gameIds } },
        { $push: { tags: tagData._id.toString() } },
      )
      await Promise.all(
        gameIds.map(async (gameId, priority) => {
          const path = `tagPriorities.${tagData._id}`
          await updateGame({ _id: gameId }, { $set: { [path]: priority + 1 } })
        }),
      )
    }
    return tagData
  },
})
