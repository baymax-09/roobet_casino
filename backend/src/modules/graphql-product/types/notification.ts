import { objectType } from 'nexus'

export const NotificationType = objectType({
  name: 'Notification',
  sourceType: {
    module: __dirname,
    export: 'DBNotification',
  },
  isTypeOf(data) {
    return Boolean('message' in data)
  },
  definition(type) {
    type.nonNull.id('id', {
      auth: null,
      resolve: ({ _id }) => _id.toString(),
    })
    type.nonNull.string('message')
    type.nonNull.string('userId')
    type.nonNull.boolean('read')
    type.string('type')
    type.json('meta')
    type.nonNull.date('createdAt')
    type.nonNull.date('updatedAt')
  },
})
