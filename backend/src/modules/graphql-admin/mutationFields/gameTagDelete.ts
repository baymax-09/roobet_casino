import { mutationField, idArg, nonNull } from 'nexus'

import { deleteTag } from 'src/modules/tp-games/documents/gameTags'
import { updateGames } from 'src/modules/tp-games/documents/games'

export const GameTagDeleteMutationField = mutationField('gameTagDelete', {
  description: 'Delete a Game Tag',
  type: 'GameTag',
  args: { id: nonNull(idArg()) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'tpgametags', action: 'delete' }],
  },
  resolve: async (_, { id }) => {
    await updateGames({}, { $pull: { tags: id } })
    // TODO remove tagPriorities for this tagId on tp_games
    return await deleteTag(id)
  },
})
