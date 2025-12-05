import { objectType } from 'nexus'

export const TPGameBlockType = objectType({
  name: 'TPGameBlock',
  description:
    'List of thrid party games by identifier that are currently blocked on the production site.',
  sourceType: {
    module: __dirname,
    export: 'DBTPGameBlocks',
  },
  definition(type) {
    type.nonNull.id('id', {
      auth: null,
      // @ts-expect-error TODO how to cleanly define our base types and then add _id
      resolve: ({ _id }) => _id.toString(),
    })
    type.nonNull.string('key')
    type.nonNull.string('value')
  },
})
