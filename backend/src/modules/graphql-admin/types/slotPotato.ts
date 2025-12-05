import { objectType } from 'nexus'

import { addTimeInMs } from 'src/util/helpers/time'

import {
  getEndDateTime,
  determineActiveGame,
} from 'src/modules/slotPotato/util'

import { SlotPotatoGameType } from './slotPotatoGame'

export const SlotPotatoType = objectType({
  name: 'SlotPotato',
  sourceType: {
    module: __dirname,
    export: 'DBSlotPotato',
  },
  definition(type) {
    type.nonNull.objectId('id', {
      auth: null,
      resolve: ({ _id }) => _id,
    })
    type.nonNull.date('startDateTime')
    type.nonNull.date('endDateTime', {
      auth: null,
      resolve: ({ startDateTime, gameDuration, games }) =>
        getEndDateTime(startDateTime, gameDuration, games.length),
    })
    type.nonNull.boolean('disabled')
    type.nonNull.int('gameDuration')
    type.nonNull.list.nonNull.field('games', {
      auth: null,
      type: SlotPotatoGameType,
      resolve: ({ startDateTime, gameDuration, games }) => {
        const gamesWithDate = games
          .sort((a, b) => a.order - b.order)
          .map((game, idx) => {
            const gameStartDateTime = addTimeInMs(
              gameDuration * idx,
              startDateTime,
            )
            return {
              ...game,
              startDateTime: gameStartDateTime,
              endDateTime: addTimeInMs(gameDuration, gameStartDateTime),
            }
          })
        return gamesWithDate
      },
    })
    type.nonNull.boolean('isActive')
    type.field('activeGame', {
      auth: null,
      type: SlotPotatoGameType,
      description:
        'The active game in the slot potato event, returns null if there is no active game',
      resolve: async ({ startDateTime, games, gameDuration }) => {
        return (
          (await determineActiveGame(startDateTime, gameDuration, games)) ??
          null
        )
      },
    })
  },
})
