import { objectType } from 'nexus'
import { Types } from 'mongoose'

import { getGame } from 'src/modules/tp-games/documents/games'

export const SlotPotatoGameType = objectType({
  name: 'SlotPotatoGame',
  definition(type) {
    type.nonNull.objectId('gameId')
    type.nonNull.date('startDateTime')
    type.nonNull.date('endDateTime')
    type.nonNull.int('order', {
      auth: null,
      description: 'The order of the game in the slot potato event',
    })
    type.field('game', {
      auth: null,
      type: 'TPGameAdmin',
      resolve: async ({ gameId }) =>
        gameId ? await getGame({ _id: new Types.ObjectId(gameId) }) : null,
    })
  },
})
