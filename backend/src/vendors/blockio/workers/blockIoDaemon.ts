import { config } from 'src/system'
import { runJob, runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'
import {
  type BlockioCryptoSymbol,
  BlockioCryptoSymbolList,
} from 'src/modules/crypto/types'

import { useBlockioApi, type BlockioApi } from '../lib'
import {
  isBlockioNotificationType,
  type BlockioNotificationType,
} from './../types'
import { blockioLogger } from '../lib/logger'

async function start(): Promise<void> {
  while (true) {
    await startJob()
    await sleep(1000 * 60) // 1 minutes
  }
}

async function startJob(): Promise<void> {
  for (const crypto of BlockioCryptoSymbolList) {
    const blockIoApi = useBlockioApi(crypto)
    manageNotifications(crypto, blockIoApi).catch(error => {
      blockioLogger('startJob', { userId: null }).error(
        'Failed to process notifications',
        { crypto },
        error,
      )
    })
  }
}

async function manageNotifications(
  crypto: BlockioCryptoSymbol,
  blockIoApi: BlockioApi,
) {
  const notifications = await blockIoApi.listNotifications()

  const createdNotifications: Record<
    Exclude<BlockioNotificationType, 'address'>,
    boolean
  > = {
    account: false,
    'new-blocks': false,
  }

  for (const notification of notifications) {
    const { type, enabled, notification_id } = notification

    if (!isBlockioNotificationType(type)) {
      continue
    }

    // if we want to delete notifications in the future we can!
    if ((type === 'account' || type === 'new-blocks') && enabled) {
      createdNotifications[type] = true
      blockioLogger('manageNotifications', { userId: null }).info(
        `${crypto} has notification, skipping.`,
      )
    } else {
      await blockIoApi.deleteNotification(notification_id)
    }
  }

  for (const [key, value] of Object.entries(createdNotifications)) {
    if (!isBlockioNotificationType(key)) {
      continue
    }
    if (!value) {
      await blockIoApi.createNotification(crypto, key)
    }
  }
}

export async function run() {
  if (config.oneshot) {
    runJob('blockIoDaemon', startJob)
  } else {
    runWorker('blockIoDaemon', start)
  }
}
