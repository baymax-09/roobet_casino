import { objectType } from 'nexus'

export const MessageTemplateType = objectType({
  name: 'MessageTemplate',
  sourceType: {
    module: __dirname,
    export: 'DBMessageTemplate',
  },
  definition(type) {
    type.nonNull.id('id', {
      auth: null,
      resolve: ({ _id }) => _id.toString(),
    })
    type.nonNull.string('name')
    type.nonNull.string('title')
    type.nonNull.string('body')
    type.string('heroImage')
    type.boolean('deleted')
    type.date('deletedAt')
    type.nonNull.date('createdAt')
    type.nonNull.date('updatedAt')
  },
})
