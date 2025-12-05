import { objectType } from 'nexus'

import { type ProductMessage } from '.'
import { type MessageReadReceiptDocument } from 'src/modules/messaging/messages/documents/messageReadReceipt'

export const MessageType = objectType({
  name: 'Message',
  sourceType: {
    module: __dirname,
    export: 'ProductMessage',
  },
  isTypeOf(data) {
    return Boolean('heroImage' in data && !('recipients' in data))
  },
  definition(type) {
    type.nonNull.id('id', {
      auth: null,
      resolve: ({ _id }) => _id.toString(),
    })
    type.nonNull.string('title')
    type.nonNull.string('body')
    type.string('heroImage')
    type.string('logoImage')
    type.string('featuredImage')
    type.string('link')
    type.nonNull.boolean('live')
    type.date('liveAt')
    type.nonNull.boolean('read', {
      auth: null,
      resolve(
        item: ProductMessage & { readReceipt?: MessageReadReceiptDocument[] },
      ) {
        return !!item.readReceipt?.length
      },
    })
    type.boolean('deleted')
    type.date('deletedAt')
    type.nonNull.date('createdAt')
    type.nonNull.date('updatedAt')
  },
})
