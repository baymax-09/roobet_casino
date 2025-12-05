import { config } from 'src/system'
import { runJob, runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'

import { getIncompleteClosedOutBets } from '../documents/bet_history_mongo'

import { closeOutBet } from '../lib/closeout'
import { betLogger } from '../lib/logger'

async function startJob(): Promise<void> {
  const incompleteBets = await getIncompleteClosedOutBets()
  const logger = betLogger('startJob', { userId: null })
  if (!incompleteBets.length) {
    return
  }

  logger.info(
    `Recovered ${incompleteBets.length} incomplete closed out bets. Processing now.`,
  )

  for (const bet of incompleteBets) {
    logger.info(`Incomplete bet. Bet ID: ${bet.betId}`, { bet })
    await closeOutBet(bet)
  }
}

async function start(): Promise<void> {
  while (true) {
    await startJob()
    await sleep(1000 * 60 * 1) // 1 minute
  }
}

export async function run() {
  if (config.oneshot) {
    runJob('betCloseout', startJob)
  } else {
    runWorker('betCloseout', start)
  }
}
