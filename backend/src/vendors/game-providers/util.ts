import { getGame } from 'src/modules/tp-games/documents/games'
import { createNotification } from 'src/modules/messaging'
import { translateForUserId } from 'src/util/i18n'
import { type Notification } from 'src/modules/messaging'

export const createFreeSpinUserNotification = async ({
  userId,
  gameIdentifier,
}: {
  userId: string
  gameIdentifier: string
}) => {
  const game = await getGame({ identifier: gameIdentifier })
  const meta: Notification['meta'] = {
    linkURL: `/game/${gameIdentifier}`,
  }

  const notificationMessage = await translateForUserId(
    userId,
    'free_spin__notification',
    [`${game?.title}`],
  )

  await createNotification(userId, notificationMessage, 'freeSpin', meta)
}
