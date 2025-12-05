import { config } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'

import {
  getSpamComplaints,
  getUnsubscribes,
  deleteUnsubscribe,
  deleteSpamComplaint,
} from '..'
import { mailgunLogger } from '../lib/logger'

export async function run() {
  if (config.isProd || config.isStaging) {
    runWorker('mailgunWorker', start)
  }
}

const logger = mailgunLogger('start', { userId: null })

async function start() {
  while (true) {
    // every second, grab a userId and run func!
    const unsubscribes = await getUnsubscribes()
    logger.info('unsubs', { unsubscribes })
    for (const unsubscribe of unsubscribes) {
      try {
        const unsubResult = await deleteUnsubscribe(unsubscribe.address)
        logger.info('delete unsub', { unsubResult })
      } catch (error) {
        logger.error('error deleting unsub', { unsubscribe }, error)
      }
      await sleep(1000)
    }

    const spamComplaints = await getSpamComplaints()
    logger.info('spamComplaints', { spamComplaints })
    for (const spamComplaint of spamComplaints) {
      await sleep(1000)
      try {
        const deleteSpamResult = await deleteSpamComplaint(
          spamComplaint.address,
        )
        logger.info('delete spamComplaint', { deleteSpamResult })
      } catch (error) {
        logger.error('error deleting spamComplaint', { spamComplaint }, error)
      }
    }
    /*
     * deleting these is dangerous for deliverability
     * const bounces = await getBounces()
     * winston.info('bounces', bounces)
     * for (let bounce of bounces) {
     * await sleep(1000)
     * try {
     *  winston.info('delete bounce', await deleteBounce(bounce.address))
     * } catch(e) {
     *  winston.error('error deleting bounce', bounce, e)
     * }
     * }
     */
    await sleep(60 * 30 * 1000)
  }
}
