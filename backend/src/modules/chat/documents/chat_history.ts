import moment from 'moment'

import { r } from 'src/system'
import { cleanupOldTableLeavingMinimumPerUser } from 'src/util/rethink'
import { type Types as UserTypes } from 'src/modules/user'
import { type DBCollectionSchema } from 'src/modules'
import { type Currency } from 'src/modules/currency/types'

export type MessageType =
  | 'raffle'
  | 'tip'
  | 'regular'
  | 'announcement'
  | 'balance'
  | 'shake'

// TODO create discriminated union type for optional properties from different message types.
export interface ChatHistory {
  announcement?: boolean
  amount?: number
  currency?: Currency
  userId?: string
  timestamp: string
  locale: string
  id?: string // TODO: Fix this. Some places expect an id, some don't. These uses should be separated.
  type: MessageType
  message?: string
  user?: UserTypes.DisplayUser
  balanceType?: UserTypes.BalanceType
  balance?: number
  command?: string
  winners?: UserTypes.DisplayUser[]
  toUserName?: string
  toUserId?: string
  note?: string
  userStatus?: string
  hidden?: boolean // TODO: Check if optional
  name?: string // TODO: Check if optional
}

export interface ChatHistoryDB extends ChatHistory {
  id: string
}

const ChatHistoryModel = r.table<ChatHistoryDB>('chat_history')

export async function insertMessage(message: ChatHistory) {
  return await ChatHistoryModel.insert(message).run()
}

export async function getMessagesByUserId(userId: string) {
  return await ChatHistoryModel.between(
    [userId, r.minval],
    [userId, r.maxval],
    { index: 'userId__timestamp' },
  )
    .orderBy({ index: r.desc('userId__timestamp') })
    .run()
}

export async function hideUserRecentMessages(userId: string) {
  return await ChatHistoryModel.getAll(userId, { index: 'userId' })
    .update({ hidden: true })
    .run()
}

export async function hideMessage(id: string) {
  await ChatHistoryModel.get(id).update({ hidden: true }).run()
}

export async function getLatestMessagesByLocale(
  locale: string,
): Promise<ChatHistory[]> {
  const messages = await ChatHistoryModel.between(
    [locale, r.minval],
    [locale, r.maxval],
    {
      index: 'locale__timestamp',
    },
  )
    .orderBy({ index: r.desc('locale__timestamp') })
    .filter(r.row.hasFields('hidden').not())
    .limit(40)
    .run()

  return messages
}

const chatHistoryCleanup = async () => {
  await cleanupOldTableLeavingMinimumPerUser(
    'chat_history',
    moment().subtract(3, 'months').toISOString(),
    'timestamp',
    'userid',
    50,
  )
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'chat_history',
  indices: [
    { name: 'userId' },
    { name: 'timestamp' },
    { name: 'userId__timestamp', cols: p => [p('userId'), p('timestamp')] },
    { name: 'locale__timestamp', cols: p => [p('locale'), p('timestamp')] },
  ],
  cleanup: [chatHistoryCleanup],
}
