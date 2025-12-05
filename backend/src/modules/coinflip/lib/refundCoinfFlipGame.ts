import { getActiveBetById, refundBet } from 'src/modules/bet'
import { checkSystemEnabled } from 'src/modules/userSettings'
import { type Types as UserTypes } from 'src/modules/user'
import { APIValidationError } from 'src/util/errors'

import {
  findCoinFlipGameById,
  setGameAsRefunded,
} from '../documents/coinFlipGames'

export async function refundCoinFlipGame(
  userAuthor: UserTypes.User,
  gameId: string,
): Promise<{ success: boolean; gameId?: string }> {
  const isEnabled = await checkSystemEnabled(userAuthor, 'coinflip')

  if (!isEnabled) {
    throw new APIValidationError('action__disabled')
  }

  const gameData = await findCoinFlipGameById(gameId)

  if (!gameData || gameData.userIdAuthor !== userAuthor.id) {
    throw new APIValidationError('game__not_found')
  }

  if (gameData.status !== 'open') {
    throw new APIValidationError('game__not_open')
  }

  const refundedGame = await setGameAsRefunded({
    gameId,
    userId: userAuthor.id,
  })

  if (!refundedGame) {
    throw new APIValidationError('game__not_refunded')
  }

  const bet = await getActiveBetById(gameData.betIdByAuthor)
  if (!bet) {
    throw new APIValidationError('bet__not_found')
  }

  await refundBet(bet, 'coinflip')

  return { success: true, gameId }
}
