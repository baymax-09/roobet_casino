import moment from 'moment'

import { io } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import { mongoChangeFeedHandler } from 'src/util/mongo'
import { isHouseGameName } from 'src/modules/game/types'

import {
  BetHistoryModel,
  type BetHistoryDocument,
} from '../documents/bet_history_mongo'
import { populateGameDataOnBets } from '../lib/games'

let latestEmit: number = Date.now()
const HOUSE_GAME_BET_CHANCE = 0.25

// If the latest emit is over 30 seconds ago, trigger health check to fail.
const doHealthCheck = () => {
  const stalled = Date.now() - latestEmit > 30 * 1000

  if (stalled) {
    global.DEPLOYMENT_UNAVAILABLE = {
      reason: `bet feed has not emitted message since ${latestEmit}`,
    }
  }
}

const populateBet = async (bet: BetHistoryDocument) => {
  // Add nested game data to bet document.
  const [betWithGameData] = await populateGameDataOnBets([bet])

  // Override timestamp so the order is as expected.
  betWithGameData.timestamp = new Date()

  return betWithGameData
}

async function start() {
  let allBetsStack: BetHistoryDocument[] = []

  await mongoChangeFeedHandler<BetHistoryDocument>(
    BetHistoryModel,
    async document => {
      if (document.operationType === 'insert' && document.fullDocument) {
        const bet = document.fullDocument

        bet.addedAt = moment().toISOString()

        // Add to all bets bucket.
        allBetsStack.push(bet)

        // Emit self bets always.
        io.to(bet.userId).emit('new_bet_self', bet)

        // Record last emit for health check.
        latestEmit = Date.now()
      }
    },
  )

  /*
   * Every second:
   * 1. strip old bets (15 sec ttl)
   * 2. order by betAmount
   * 3. emit out the last in the bucket
   */
  setInterval(async () => {
    if (!allBetsStack.length) {
      return
    }

    allBetsStack = allBetsStack.filter(bet => {
      // check the ttl..
      const now = moment()
      const betTime = moment(bet.addedAt)
      const difference = now.diff(betTime, 'seconds')
      return difference < 15
    })

    allBetsStack.sort((a, b) => b.betAmount - a.betAmount)

    let betToEmit = null

    // We want a 6 House game, 5 TP game bet distribution if possible
    if (Math.random() < HOUSE_GAME_BET_CHANCE) {
      betToEmit = allBetsStack.find(bet => isHouseGameName(bet.gameName))

      if (betToEmit) {
        // Remove the house game bet from the allBetsStack
        const indexToRemove = allBetsStack.indexOf(betToEmit)
        allBetsStack.splice(indexToRemove, 1)

        const bet = await populateBet(betToEmit)
        io.emit('new_bet', bet)
        return
      }
    }

    betToEmit = allBetsStack.shift()!

    const bet = await populateBet(betToEmit)
    io.emit('new_bet', bet)

    doHealthCheck()
  }, 1000)
}

export async function run() {
  runWorker('betFeed', start)
}
