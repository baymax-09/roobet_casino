import React from 'react'

import { useToasts } from 'common/hooks'
import { playSound } from 'app/lib/sound'

import { type ExistingMessage } from '../types'

const triggerPusherChannels = (
  userId: number,
  pusher: any,
  fetchRichInboxMessages: () => Promise<void>,
) => {
  if (pusher) {
    const pusherChannel = pusher.subscribe(
      `private-prisma-${window.fasttrackbrandId}-${userId}`,
    )

    pusherChannel.bind('pusher:subscription_error', function (data) {
      console.error('Pusher channel error: ', data)
    })

    pusherChannel.bind('inbox', async (data: ExistingMessage) => {
      // Send toast notification if a push notification was sent
      if (data.DisplayType === 'push') {
        const { toast } = useToasts()
        const text = data.PreviewText ? data.PreviewText : data.Message
        toast.info(text)
        playSound('notification', 'newNotif')
      }
      await fetchRichInboxMessages()
    })
  }
}

export const usePusherChannels = (
  userId: number | null,
  pusher: any,
  fetchRichInboxMessages: () => Promise<void>,
) => {
  React.useEffect(() => {
    if (pusher && userId) {
      triggerPusherChannels(userId, pusher, fetchRichInboxMessages)
    }
  }, [pusher, userId, fetchRichInboxMessages])

  if (!userId) {
    return null
  }
}
