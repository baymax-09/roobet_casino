import { objectType, list, nonNull } from 'nexus'

import { DataLoaders } from 'src/modules/tp-games'

export const TPGameType = objectType({
  name: 'TPGame',
  sourceType: {
    module: __dirname,
    export: 'DBTPGame',
  },
  definition(type) {
    type.nonNull.string('id', {
      auth: null,
      resolve: ({ _id }) => _id.toString(),
    })
    type.nonNull.string('title')
    type.nonNull.string('identifier')
    type.nonNull.string('provider')
    type.nonNull.string('category')
    type.list.string('devices')
    type.nonNull.boolean('hasFunMode')
    type.list.nonNull.string('blacklist', {
      auth: null,
      resolve: ({ blacklist }, _, { isUserWhitelisted }) =>
        isUserWhitelisted ? [] : blacklist,
    })
    type.list.nonNull.string('tagIds', {
      auth: null,
      resolve: ({ tags }) => tags ?? [],
    })
    type.field('tags', {
      type: list(nonNull('GameTag')),
      auth: null,
      resolve: async ({ tags: tagIds }) => {
        return await DataLoaders.loadGameTags(tagIds)
      },
    })
    type.string('popularity')
    type.string('gid')
    type.string('squareImage')
    type.string('category')
    type.nonNull.date('releasedAt')
    type.nonNull.string('aggregator', {
      auth: null,
      resolve: ({ aggregator }) => aggregator || 'provider',
    })
    type.string('iframeSubdomain')
    type.json('tagPriorities')
    type.nonNull.date('createdAt')
  },
})
