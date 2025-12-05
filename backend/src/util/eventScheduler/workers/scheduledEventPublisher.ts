import { config } from 'src/system'
import { runJob, runWorker } from 'src/util/workerRunner'

import { getAllScheduledEventsToTrigger } from '../documents/scheduledEvents'
import { triggerScheduledEvent } from '../lib'
import { scopedLogger } from 'src/system/logger'

const startJob = async () => {
  try {
    const scheduledEvents = await getAllScheduledEventsToTrigger()
    await Promise.all(scheduledEvents.map(triggerScheduledEvent))
  } catch (error) {
    scopedLogger('eventScheduler')('startJob', { userId: null }).error(
      'error',
      {},
      error,
    )
  }
}

async function start(): Promise<void> {
  setInterval(startJob, 1000 * 60)
}

export async function run() {
  if (config.oneshot) {
    runJob('scheduledEventPublisher', startJob)
  } else {
    runWorker('scheduledEventPublisher', start)
  }
}
