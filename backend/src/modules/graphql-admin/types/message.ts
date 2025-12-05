import { objectType, interfaceType } from 'nexus'

import { type Message } from 'src/modules/messaging/messages/documents/message'
import { type MessageReadReceiptDocument } from 'src/modules/messaging/messages/documents/messageReadReceipt'
import { getReadReceiptCountForMessage } from 'src/modules/messaging/messages/documents/messageReadReceipt'

const MessageBaseType = interfaceType({
  name: 'MessageBase',
  sourceType: {
    module: __dirname,
    export: 'DBMessage',
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
      resolve(item: Message & { readReceipt?: MessageReadReceiptDocument[] }) {
        return !!item.readReceipt?.length
      },
    })
    type.boolean('deleted')
    type.date('deletedAt')
    type.nonNull.date('createdAt')
    type.nonNull.date('updatedAt')
  },
})

export const MessageType = objectType({
  name: 'Message',
  sourceType: {
    module: __dirname,
    export: 'DBMessage',
  },
  isTypeOf(data) {
    return Boolean('heroImage' in data && !('recipients' in data))
  },
  definition(type) {
    type.implements(MessageBaseType)
  },
})

export const MessageDetailedType = objectType({
  name: 'MessageDetailed',
  sourceType: {
    module: __dirname,
    export: 'DBMessage',
  },
  isTypeOf(data) {
    return Boolean('heroImage' in data && 'recipients' in data)
  },
  definition(type) {
    type.implements(MessageBaseType)

    type.list.nonNull.string('recipients')
    type.int('recipientCount')
    type.int('readCount', {
      auth: null,
      resolve: async message => {
        return await getReadReceiptCountForMessage(message._id)
      },
    })
  },
})
