import moment from 'moment'

import { Cooldown } from 'src/util/redisModels'
import { type Types as UserTypes, getUserForDisplay } from 'src/modules/user'
import { type BalanceType } from 'src/modules/user/balance'

import { addMessage } from './process'

export async function addTipMessage(
  toUser: UserTypes.User,
  fromUser: UserTypes.User,
  amount: number,
  note: string,
  balanceType: BalanceType,
) {
  await Cooldown.processFunctionOnCooldown(
    `addTipMessage:${fromUser.id}`,
    15,
    async () => {
      await addMessage({
        balanceType,
        timestamp: moment().toISOString(),
        toUserName: toUser.name,
        toUserId: toUser.id,
        userId: fromUser.id,
        amount,
        locale: 'en',
        note,
        type: 'tip',
        user: await getUserForDisplay(fromUser),
        message: `${toUser.name} got a tip from ${fromUser.name} of ${amount} - ${note}`,
        // temporary default value
        currency: 'usd',
      })
    },
  )
}

export async function addAnnouncement(message: string) {
  await addMessage({
    timestamp: moment().toISOString(),
    message,
    userId: 'announcement',
    announcement: true,
    type: 'announcement',
    locale: 'en',
    user: {
      id: 'Announcement',
      name: 'Announcement',
      hasChatModBadge: true,
    },
  })
}
