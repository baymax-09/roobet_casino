import { objectType, list, nonNull, enumType } from 'nexus'

import { GameTags } from 'src/modules/tp-games/documents'

const TPGameApprovalStatusEnumType = enumType({
  name: 'TPGameApprovalStatusEnumType',
  members: ['pending', 'approved', 'declined'],
  description: 'Allowed approval statuses for our TPGames',
})

export const TPGameAdminType = objectType({
  name: 'TPGameAdmin',
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
    type.list.nonNull.string('devices')
    type.nonNull.boolean('hasFunMode')
    type.list.nonNull.string('blacklist')
    type.list.nonNull.string('tagIds', {
      auth: null,
      resolve: ({ tags }) => tags ?? [],
    })
    type.field('tags', {
      type: list(nonNull('GameTag')),
      auth: null,
      resolve: async ({ _id, tags }) => {
        if (tags?.length) {
          return await GameTags.getCachedTagsForGame(_id.toString(), tags)
        }
        return []
      },
    })
    type.positiveFloat('payout')
    type.string('description')
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
    type.field('approvalStatus', {
      type: TPGameApprovalStatusEnumType,
      auth: {
        authenticated: true,
        accessRules: [{ resource: 'tpgames', action: 'read' }],
      },
    })
  },
})
