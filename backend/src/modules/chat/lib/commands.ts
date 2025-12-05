import { BasicCache, Cooldown } from 'src/util/redisModels'

import { APIValidationError } from 'src/util/errors'
import { getSelectedBalanceFromUser } from 'src/modules/user/balance'

import { type ChatHistory } from '../documents/chat_history'
import { createCustomMessage } from './process'
import { addAnnouncement } from './specialMessages'

export type StaffCommandMessage = ChatHistory & { args: string }
type StaffCommandFunction = (message: StaffCommandMessage) => Promise<void>
type PublicCommandFunction = (message: ChatHistory) => Promise<void>

export const staffCommands: Record<string, StaffCommandFunction> = {
  '/slowmode': slowmodeCommand,
}

export const publicCommands: Record<string, PublicCommandFunction> = {
  '/balance': balanceCommand,
  '/shake': shakeCommand,
}

export async function balanceCommand(message: ChatHistory) {
  await createCustomMessage(message, 'balance', async function (message, user) {
    const balanceReturn = await getSelectedBalanceFromUser({ user })
    const { balance, balanceType } = balanceReturn
    if (balance < 0.01) {
      throw new APIValidationError('bal__com_min')
    }
    return { balanceType, balance }
  })
}

export async function shakeCommand(message: ChatHistory) {
  await createCustomMessage(message, 'shake', async () => ({}))
}

export async function checkSlowmode(userId: string) {
  if (await BasicCache.get('slowmode', 'slowmodeOn')) {
    const result = await Cooldown.checkSet(`slowmode:${userId}`, 20)
    if (result > 0 && result) {
      throw new APIValidationError('chat__slowmode')
    }
  }
}

export async function addSlowmodeMessage() {
  await addAnnouncement(
    'Chat is now in slowmode, there will be a short time you must wait between sending messages.',
  )
}

export async function slowmodeCommand(message: ChatHistory & { args: string }) {
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
