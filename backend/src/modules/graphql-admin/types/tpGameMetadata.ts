import { objectType } from 'nexus'

export const TPGameMetadataType = objectType({
  name: 'TPGameMetadata',
  definition(type) {
    type.nonNull.list.nonNull.string('categories')
    type.nonNull.list.nonNull.string('aggregators')
    type.nonNull.list.nonNull.string('providers')
  },
})
