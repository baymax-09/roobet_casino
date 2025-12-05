import moment from 'moment'

import { r } from 'src/system'
import { tuid } from 'src/util/i18n'
import { type DBCollectionSchema } from 'src/modules'

export interface ChatBan {
  id: string
  chatMutedBy?: string
  mutedAt?: string
  muteTime?: string | null
  muteCount?: number
  muteReason?: string
  chatBanned?: boolean
  chatBannedBy?: string
  banCount?: number
  banReason?: string
}

const ChatBansModel = r.table<ChatBan>('bans')

async function checkChatBan(userId: string) {
  const ban: ChatBan | null = await ChatBansModel.get(userId).run()

  if (ban && ban.chatBanned) {
    return await tuid(userId, 'chat__banned')
  } else if (ban && ban.muteTime && ban.muteTime > moment().toISOString()) {
    /*
     * here we need to do some stuff.
     * we need to calculate the diff between mute time and now.
     */
    return await tuid(userId, 'chat__muted', [
      `${moment(ban.muteTime).fromNow()}`,
    ])
  }
  return false
}

export async function getChatBanStatus(userId: string) {
  const ban = await ChatBansModel.get(userId).run()
  return ban
}

async function mute(
  userId: string,
  banee: string,
  seconds: number,
  reason: string,
) {
  const mute = await ChatBansModel.get(userId).run()
  if (mute) {
    await ChatBansModel.get(userId)
      .update({
        chatMutedBy: banee,
        mutedAt: moment().toISOString(),
        muteTime: moment().add(seconds, 'seconds').toISOString(),
        muteCount: r.row('muteCount').add(1).default(1),
        muteReason: reason,
      })
      .run()
  } else {
    await ChatBansModel.insert({
      id: userId,
      chatMutedBy: banee,
      muteTime: moment().add(seconds, 'seconds').toISOString(),
      muteCount: 1,
      muteReason: reason,
    }).run()
  }
}

async function unMute(userId: string) {
  const mute = await ChatBansModel.get(userId).run()
  if (mute) {
    await ChatBansModel.get(userId).update({ muteTime: null }).run()
  }
}

async function chatBan(userId: string, banee: string, reason: string) {
  const ban = await ChatBansModel.get(userId).run()
  if (ban) {
    await ChatBansModel.get(userId)
      .update({
        chatBanned: true,
        chatBannedBy: banee,
        banCount: r.row('banCount').add(1).default(1),
        banReason: reason,
      })
      .run()
  } else {
    await ChatBansModel.insert({
      id: userId,
      chatBanned: true,
      chatBannedBy: banee,
      banCount: 1,
      banReason: reason,
    }).run()
  }
}

async function chatUnBan(userId: string) {
  const ban = await ChatBansModel.get(userId).run()
  if (ban) {
    await ChatBansModel.get(userId).update({ chatBanned: false }).run()
  }
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'bans',
}

export const bans = {
  checkChatBan,
  mute,
  unMute,
  chatBan,
  chatUnBan,
  getChatBanStatus,
}
