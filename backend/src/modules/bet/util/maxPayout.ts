import { config } from 'src/system'
import { slackHighAlert } from 'src/vendors/slack'
import { changeSystemsEnabledUser } from 'src/modules/userSettings'
import { disableGame } from 'src/modules/tp-games/documents/games'

import { betLogger } from '../lib/logger'

export async function preventOverMaxPayout(
  userId: string,
  payoutValue: number,
  gameIdentifier: string,
): Promise<boolean> {
  if (payoutValue > config.bet.maxPayout) {
    await changeSystemsEnabledUser(userId, ['tip', 'withdraw'], false)
    await disableGame(gameIdentifier)
    slackHighAlert(
      `[User ID: ${userId}] has hit above max payout [Payout: ${payoutValue}] on [Game: ${gameIdentifier}]. Withdrawals and tips for user have been disabled. [Game: ${gameIdentifier}] has also been disabled`,
    )
    betLogger('preventOverMaxPayout', { userId }).info(
      'User has hit above a max payout.',
      { gameIdentifier, payoutValue },
    )
    return true
  }
  return false
}
