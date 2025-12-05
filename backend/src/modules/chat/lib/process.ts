import moment from 'moment'

import { io } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import { getUserById, getUserForDisplay } from 'src/modules/user'
import { APIValidationError } from 'src/util/errors'

import { type ChatHistory, type MessageType } from '../documents/chat_history'
import { insertMessage } from '../documents/chat_history'
import {
  staffCommands,
  publicCommands,
  type StaffCommandMessage,
} from './commands'

const getChatIo = () => io || null

export async function createCustomMessage(
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

export async function processMessage(chatHistory: ChatHistory) {
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

export async function addMessage(chatMessage: ChatHistory): Promise<void> {
  delete chatMessage.id // TODO why are we inserting something that already has an id?
  const data = await insertMessage(chatMessage)
  chatMessage.id = data.generated_keys[0]
  const chatIo = getChatIo()
  chatIo.emit('chat_message', chatMessage)
}
