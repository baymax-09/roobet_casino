import { config } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'

import {
  bulkUpdateWithdrawalStatus,
  getPendingWithdrawals,
  getStaleCryptoWithdraws,
} from '../documents/withdrawals_mongo'
import { backgroundWithdrawalProcess } from 'src/modules/withdraw'
import { getUserById } from 'src/modules/user'
import { scopedLogger } from 'src/system/logger'

const withdrawLogger = scopedLogger('withdraw')

export async function run() {
  if (config.isProd || config.runWithdrawWorker) {
    runWorker('withdrawWorker', start)
  }
}

async function start(): Promise<void> {
  while (true) {
    await processWithdrawals()
    await sleep(1000 * 30) // 30 seconds
  }
}

async function processWithdrawals(): Promise<void> {
  await processPendingWithdrawals()
  await updateStaleWithdraws()
}

async function updateStaleWithdraws() {
  const logger = withdrawLogger('updateStaleWithdraws', { userId: null })

  const staleWithdraws = await getStaleCryptoWithdraws()
  const staleWithdrawIds = staleWithdraws.map(withdraw => withdraw.id)

  logger.info(
    `updating the status of ${staleWithdraws.length} withdrawals to pending`,
    { staleWithdrawIds },
  )

  await bulkUpdateWithdrawalStatus(staleWithdrawIds, 'pending')
}

async function processPendingWithdrawals() {
  const logger = withdrawLogger('processPendingWithdrawals', { userId: null })

  const pendingWithdraws = await getPendingWithdrawals()
  const pendingWithdrawIds = pendingWithdraws.map(withdraw => withdraw.id)

  logger.info(`processing ${pendingWithdraws.length} withdrawals`, {
    pendingWithdrawIds,
  })

  for (const withdraw of pendingWithdraws) {
    logger.info('processing withdrawal', { withdraw })

    const user = await getUserById(withdraw.userId)

    if (!user) {
      logger.info('failed to processes withdrawal, missing user', { withdraw })
      throw new Error(`User not found for withdrawal ${withdraw.id}`)
    }

    try {
      await backgroundWithdrawalProcess(user, withdraw)
    } catch (error) {
      logger.error('failed to process withdrawal', { withdraw }, error)
    } finally {
      await sleep(1000 * 2)
    }
  }
}
