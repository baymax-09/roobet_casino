import { inputObjectType, objectType } from 'nexus'

export const TPGamesFilterType = inputObjectType({
  name: 'GamesFilter',
  definition(type) {
    type.string('title')
    type.list.string('categories')
    type.list.string('aggregators')
    type.list.string('tags')
    type.list.string('providers')
    type.list.string('approvalStatuses')
  },
})

export const TPGamesAdminGetPaginatedResponseType = objectType({
  name: 'TPGameAdminPage',
  definition(type) {
    type.nonNull.int('limit')
    type.nonNull.int('page')
    type.nonNull.int('count')
    type.nonNull.list.field('data', { type: 'TPGameAdmin', auth: null })
  },
})
