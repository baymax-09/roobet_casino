import { objectType } from 'nexus'

export const PlayerTagType = objectType({
  name: 'PlayerTag',
  definition(type) {
    type.nonNull.string('userId')
    type.nonNull.string('tagId')
    type.nonNull.date('createdAt')
    type.nonNull.date('updatedAt')
  },
})
