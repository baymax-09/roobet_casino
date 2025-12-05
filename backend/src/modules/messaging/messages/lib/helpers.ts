import { getUserIdByName } from 'src/modules/user'
import {
  getCachedMessagesForAllUsers,
  getMessagesForUserId,
} from '../documents/message'
import { getReadReceiptsForMessages } from '../documents/messageReadReceipt'

const UUID_V4 =
  /^[A-Za-z0-9]{8}-[A-Za-z0-9]{4}-4[A-Za-z0-9]{3}-[A-Za-z0-9]{4}-[A-Za-z0-9]{12}$/

export const isValidUUID = (test: string): boolean => {
  return !!test.match(UUID_V4)
}

export const getRecipientsByNameOrId = async (
  recipients: string[] | undefined | null,
): Promise<string[] | null> => {
  if (!recipients) {
    return null
  }

  const ids = await Promise.all(
    recipients.map(async usernameOrId => {
      if (isValidUUID(usernameOrId)) {
        return usernameOrId
      }

      return await getUserIdByName(usernameOrId, true)
    }),
  )

  return [...new Set(ids.filter((val): val is string => !!val))]
}

export const getAllMessagesWithReadReceipts = async (userId: string) => {
  // Get messages sent to all users, determine if they are read.
  const allMessages = await getCachedMessagesForAllUsers()

  const allReadReceipts = await getReadReceiptsForMessages(
    userId,
    allMessages.map(({ _id }) => _id),
  )
  const allUserMessages = allMessages.map(message => {
    const readReceipt = allReadReceipts.find(({ messageId }) =>
      messageId.equals(message._id),
    )

    return {
      ...message,
      // Match aggregate result.
      readReceipt: readReceipt ? [readReceipt] : undefined,
    }
  })

  const userMessages = (await getMessagesForUserId(userId)).map(message => {
    // @ts-expect-error readReceipt present when lean = false
    const { readReceipt } = message
    return {
      ...message,
      readReceipt:
        readReceipt && readReceipt.length > 0 ? readReceipt : undefined,
    }
  })

  return allUserMessages.concat(userMessages)
}
