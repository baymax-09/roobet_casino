import { config } from 'src/system'
import { buildGameHashTable } from 'src/modules/game'
import { runWorker } from 'src/util/workerRunner'
import { set } from 'src/util/redisModels/basicCache'
import { sleep } from 'src/util/helpers/timer'

import { growthFunction } from '../lib/helpers/hash'
import { CrashHashModel } from '../documents/crash_hash'
import { type CrashGame } from '../documents/crash_game'
import {
  closeoutGame,
  initializeAndRecoverGameState,
  startNextGame,
  updateGameReturnUpdated,
} from '../documents/crash_game'
import { betStateTime, overStateTime } from '../constants/game'
import { CrashStates } from '../lib/helpers/states'
import {
  cashoutActiveBetsForGame,
  addBetFeedIfNotExists,
  closeoutBetFeedIfExists,
} from '../lib/helpers/crash_bet'
import { CrashGameServerOrchestrator } from '../CrashGameServerOrchestrator'
import { crashLogger } from '../lib/logger'

let crashStartTime: number = Date.now()

/*
 * there is a memory leak on crash that causes it to
 * crash twice a day. RN we are restarting it every 8 hours
 */
async function checkIfWeShouldShutdown() {
  const logger = crashLogger('checkIfWeShouldShutdown', { userId: null })
  const hoursToRestart = 8
  const secondsSinceStart = Math.abs(Date.now() - crashStartTime) / 1000
  const hoursSinceStart = secondsSinceStart / 3600
  logger.info(
    `[crash] seconds since start ${secondsSinceStart}, hours ${hoursSinceStart}`,
    { secondsSinceStart, hoursSinceStart },
  )
  if (hoursSinceStart > hoursToRestart) {
    logger.info(
      `[crash] shutting down every ${hoursToRestart} hours - this crash started ${crashStartTime} it is now ${new Date().toISOString()}`,
      {
        hoursToRestart,
        crashStartTime,
        currentDateTime: new Date().toISOString(),
      },
    )
    await sleep(5000)
    process.exit(0)
  }
}

const stateDefinitions = {
  [CrashStates.NotStarted]: async function (
    game: CrashGame,
    previousGame: CrashGame,
  ) {
    set('crash', 'state', 'NotStarted', 1000000)
    set('crash', 'id', game.id, 1000000)
    await closeoutGame(game)
    game = await startNextGame(game, previousGame)
    if (config.isProd || config.isStaging) {
      await checkIfWeShouldShutdown()
    }
    return { nextStateTimeout: 0, updatedGame: game }
  },
  [CrashStates.TakingBets]: async function (game: CrashGame) {
    set('crash', 'state', 'TakingBets', 1000000)
    set('crash', 'id', game.id, 1000000)
    await addBetFeedIfNotExists(game)

    const update = {
      state: CrashStates.TakingBets,
    }

    await updateGameReturnUpdated(game.id, update)
    game = { ...game, ...update }
    set('crash', 'crashPoint', game.crashPoint, 1000000)

    return { nextStateTimeout: betStateTime, updatedGame: game }
  },
  [CrashStates.Running]: async function (game: CrashGame) {
    const runStartTime = Date.now()
    set('crash', 'state', 'Running', 1000000)
    set('crash', 'id', game.id, 1000000)
    await addBetFeedIfNotExists(game)
    if (game.state !== CrashStates.Running) {
      game.runningStartTime = new Date()
      set('crash', 'runningStartTime', game.runningStartTime, 1000000)
      await updateGameReturnUpdated(game.id, {
        state: CrashStates.Running,
        runningStartTime: game.runningStartTime,
      })
      game.state = CrashStates.Running
    }
    /*
     * do not persist the game to the DB because this happens every 100ms
     * calculate the current crash point (multiplier) and run a "tick" socket event.
     */
    const currentCrashPoint = growthFunction(game.runningMs)
    game.rerunState = currentCrashPoint < game.crashPoint

    const nextRunCrashPoint = growthFunction(game.runningMs + 100)
    if (nextRunCrashPoint >= game.crashPoint) {
      set('crash', 'state', 'Over', 1000000)
    }

    if (!game.rerunState) {
      set('crash', 'state', 'Over', 1000000)
    }

    game.runningMs = Date.now() - new Date(game.runningStartTime).getTime()
    if (currentCrashPoint >= 1.01) {
      cashoutActiveBetsForGame(game, currentCrashPoint)
    }

    // emitSocketEventForGame('crash', 'tick', [game.runningMs])

    // if we done, we done.
    if (!game.rerunState) {
      return { nextStateTimeout: 0, updatedGame: game }
    }

    const timeSpent = Date.now() - runStartTime
    const nextStateTimeout = 100 - Math.min(timeSpent, 100)
    return { nextStateTimeout, updatedGame: game }
  },
  [CrashStates.Over]: async function (game: CrashGame) {
    set('crash', 'state', 'Over', 1000000)
    set('crash', 'id', game.id, 1000000)
    closeoutBetFeedIfExists(game)
    game = await updateGameReturnUpdated(game.id, {
      state: CrashStates.Over,
    })
    return { nextStateTimeout: overStateTime, updatedGame: game }
  },
}

class Game {
  async run() {
    await buildGameHashTable('crash', CrashHashModel)
    const gameState = await initializeAndRecoverGameState()
    // TODO gameState should probably not be an optional parameter.
    // @ts-expect-error need to remove optional
    await this.processGameState(gameState?.currentGame, gameState?.previousGame)
  }

  async processGameState(game: CrashGame, previousGame: CrashGame) {
    const stateTransitions = {
      [CrashStates.NotStarted]: CrashStates.TakingBets,
      [CrashStates.TakingBets]: CrashStates.Running,
      [CrashStates.Running]: CrashStates.Over,
      [CrashStates.Over]: CrashStates.NotStarted,
    } as const

    const stateToRun = game.rerunState
      ? game.state
      : stateTransitions[game.state]
    const { nextStateTimeout, updatedGame } = await stateDefinitions[
      stateToRun
    ](game, previousGame)
    await sleep(nextStateTimeout)
    await this.processGameState(updatedGame, previousGame)
  }
}

async function start() {
  crashStartTime = Date.now()

  // Start crash state manager.
  const game = new Game()
  game.run()

  // Start crash server orchestrator.
  const crash = new CrashGameServerOrchestrator()
  crash.start()
}

export async function run() {
  runWorker('crash', start)
}
