// TODO move functions out of index.ts
import moment from 'moment'

import { io } from 'src/system'
import { BasicCache, Cooldown } from 'src/util/redisModels'
import { type Types as UserTypes } from 'src/modules/user'
import {
  getUserById,
  getUserForDisplay,
  getUserForDisplayById,
} from 'src/modules/user'
import { APIValidationError } from 'src/util/errors'
import { chatLogger } from './lib/logger'

import { type ChatHistory, type MessageType } from './documents/chat_history'
import { insertMessage } from './documents/chat_history'
import { getSelectedBalanceFromUser, type BalanceType } from '../user/balance'
export { getMessagesByUserId } from './documents/chat_history'
export { addTipMessage } from './lib/specialMessages'

export * as Documents from './documents'
export * as Routes from './routes'

type StaffCommandMessage = ChatHistory & { args: string }
type StaffCommandFunction = (message: StaffCommandMessage) => Promise<void>
type PublicCommandFunction = (message: ChatHistory) => Promise<void>

const staffCommands: Record<string, StaffCommandFunction> = {
  '/slowmode': slowmodeCommand,
}

const publicCommands: Record<string, PublicCommandFunction> = {
  '/balance': balanceCommand,
  '/shake': shakeCommand,
}

const getChatIo = () => io || null

async function createCustomMessage(
  message: ChatHistory,
  type: MessageType,
  getDataFunction: (
    message: ChatHistory,
    user: UserTypes.User,
  ) => Promise<object>,
) {
  if (!message.userId) {
    return
  }
  const user = await getUserById(message.userId)
  if (!user) {
    return
  }

  const extraData = await getDataFunction(message, user)
  await addMessage({
    timestamp: moment().toISOString(),
    userId: message.userId,
    message: message.message,
    command: message.command,
    type,
    locale: 'en',
    user: await getUserForDisplay(user),
    ...extraData,
  })
}

async function addTipMessage(
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
      chatLogger('addTipMessage', { userId: fromUser.id }).info('Tip message', {
        fromUser,
        toUser,
        note,
      })
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

async function addRaffleMessage(
  userIds: string[] = [],
  amount: number,
  balanceType: UserTypes.BalanceType,
) {
  await addMessage({
    timestamp: moment().toISOString(),
    type: 'raffle',
    locale: 'en',
    winners: await Promise.all(
      userIds.map(async function (userId) {
        return await getUserForDisplayById(userId)
      }),
    ),
    amount,
    balanceType,
  })
}

async function balanceCommand(message: ChatHistory) {
  await createCustomMessage(message, 'balance', async function (message, user) {
    const balanceReturn = await getSelectedBalanceFromUser({ user })
    const { balance, balanceType } = balanceReturn
    if (balance < 0.01) {
      throw new APIValidationError('bal__com_min')
    }
    return { balanceType, balance }
  })
}

async function shakeCommand(message: ChatHistory) {
  await createCustomMessage(message, 'shake', async () => ({}))
}

async function addAnnouncement(message: string) {
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

async function checkSlowmode(userId: string) {
  if (await BasicCache.get('slowmode', 'slowmodeOn')) {
    const result = await Cooldown.checkSet(`slowmode:${userId}`, 20)
    if (result > 0 && result) {
      throw new APIValidationError('chat__slowmode')
    }
  }
}

async function addSlowmodeMessage() {
  await addAnnouncement(
    'Chat is now in slowmode, there will be a short time you must wait between sending messages.',
  )
}

async function slowmodeCommand(message: ChatHistory & { args: string }) {
  if (message.args === 'on') {
    await BasicCache.set('slowmode', 'slowmodeOn', true, 60)
    await addSlowmodeMessage()
  } else if (message.args === 'off') {
    /*
     * turn off slowmode
     * (the expire is set to 1 because we don't need it to be false, just not true. can let expire quickly)
     */
    await BasicCache.set('slowmode', 'slowmodeOn', false, 1)
  } else {
    // if no args passed, toggle on if redis has no slowmode instance
    if (!(await BasicCache.get('slowmode', 'slowmodeOn'))) {
      await BasicCache.set('slowmode', 'slowmodeOn', true, 60)
      await addSlowmodeMessage()
    } else if (await BasicCache.get('slowmode', 'slowmodeOn')) {
      await BasicCache.set('slowmode', 'slowmodeOn', false, 1)
    }
  }
}

async function processMessage(chatHistory: ChatHistory) {
  const trimmedChatMessage = chatHistory.message?.replace(/^\s+/, '')
  const firstWord = trimmedChatMessage?.split(' ')[0]
  if (firstWord) {
    if (!staffCommands[firstWord] && !publicCommands[firstWord]) {
      await addMessage(chatHistory)
    } else {
      const commandMessage: StaffCommandMessage = {
        ...chatHistory,
        command: firstWord,
        args: chatHistory.message?.replace(`${chatHistory.command} `, '') ?? '',
      }
      if (staffCommands[firstWord]) {
        if (!commandMessage.user?.hasChatModBadge) {
          throw new APIValidationError('staff__command')
        }
        staffCommands[firstWord](commandMessage)
      } else {
        await publicCommands[firstWord](commandMessage)
      }
    }
  }
}

async function addMessage(chatMessage: ChatHistory): Promise<void> {
  delete chatMessage.id // TODO why are we inserting something that already has an id?
  const data = await insertMessage(chatMessage)
  chatMessage.id = data.generated_keys[0]
  const chatIo = getChatIo()
  chatIo.emit('chat_message', chatMessage)
}

export const chat = {
  addMessage,
  processMessage,
  addSlowmodeMessage,
  addAnnouncement,
  addTipMessage,
  addRaffleMessage,
  checkSlowmode,
}
