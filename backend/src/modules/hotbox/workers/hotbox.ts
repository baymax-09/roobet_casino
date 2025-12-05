import { config } from 'src/system'
import { instrument } from 'src/util/trace'
import { buildGameHashTable } from 'src/modules/game'
import { runWorker } from 'src/util/workerRunner'
import { set } from 'src/util/redisModels/basicCache'
import { sleep } from 'src/util/helpers/timer'

import { growthFunction } from '../lib/helpers/hash'
import { HotboxHashModel } from '../documents/hotbox_hash'
import { type HotboxGame } from '../documents/hotbox_game'
import {
  closeoutGame,
  initializeAndRecoverGameState,
  startNextGame,
  updateGameReturnUpdated,
} from '../documents/hotbox_game'
import { betStateTime, overStateTime } from '../constants/game'
import {
  cashoutActiveBetsForGame,
  addBetFeedIfNotExists,
  closeoutBetFeedIfExists,
} from '../lib/helpers/hotbox_bet'
import { HotboxGameServerOrchestrator } from '../HotboxGameServerOrchestrator'
import {
  states,
  StateNotStarted,
  StateRunning,
  StateOver,
  StateTakingBets,
} from '../lib/helpers/states'
import { hotboxLogger } from '../lib/logger'

const name = 'hotbox'
const worker = 'w-' + name.toLowerCase()

let hotboxStartTime: number = Date.now()

/*
 * there is a memory leak on hotbox that causes it to
 * die twice a day. RN we are restarting it every 8 hours
 */
async function checkIfWeShouldShutdown() {
  const logger = hotboxLogger('checkIfWeShouldShutdown', { userId: null })
  const hoursToRestart = 8
  const secondsSinceStart = Math.abs(Date.now() - hotboxStartTime) / 1000
  const hoursSinceStart = secondsSinceStart / 3600
  logger.info(
    `Seconds since start: ${secondsSinceStart} hours ${hoursSinceStart}`,
  )
  if (hoursSinceStart > hoursToRestart) {
    logger.info(
      `Shutting down every ${hoursToRestart} hours - this hotbox started ${hotboxStartTime} it is now ${new Date().toISOString()}`,
    )
    await sleep(5000)
    process.exit(0)
  }
}

const stateDefinitions = {
  [states.NotStarted]: async function (
    game: HotboxGame,
    previousGame: HotboxGame | null | undefined,
  ) {
    return instrument('states.NotStarted', worker, async () => {
      set('hotbox', 'state', 'NotStarted', 1000000)
      set('hotbox', 'id', game.id, 1000000)
      await closeoutGame(game)
      game = await startNextGame(game, previousGame)
      if (config.isProd || config.isStaging) {
        await checkIfWeShouldShutdown()
      }
      return { nextStateTimeout: 0, updatedGame: game }
    })
  },
  [states.TakingBets]: async function (game: HotboxGame) {
    return instrument('states.TakingBets', worker, async () => {
      set('hotbox', 'state', 'TakingBets', 1000000)
      set('hotbox', 'id', game.id, 1000000)
      await addBetFeedIfNotExists(game)

      const update = {
        state: states.TakingBets,
      }

      await updateGameReturnUpdated(game.id, update)
      game = { ...game, ...update }
      set('hotbox', 'crashPoint', game.crashPoint, 1000000)
      return { nextStateTimeout: betStateTime, updatedGame: game }
    })
  },
  [states.Running]: async function (game: HotboxGame) {
    return instrument('states.Running', worker, async () => {
      const runStartTime = Date.now()
      set('hotbox', 'state', 'Running', 1000000)
      set('hotbox', 'id', game.id, 1000000)
      await addBetFeedIfNotExists(game)
      if (game.state !== states.Running) {
        game.runningStartTime = new Date()
        set('hotbox', 'runningStartTime', game.runningStartTime, 1000000)
        await updateGameReturnUpdated(game.id, {
          state: states.Running,
          runningStartTime: game.runningStartTime,
        })
        game.state = states.Running
      }
      /*
       * do not persist the game to the DB because this happens every 100ms
       * calculate the current crash point (multiplier) and run a "tick" socket event.
       */
      const currentCrashPoint = growthFunction(game.runningMs)
      game.rerunState = currentCrashPoint < game.crashPoint

      const nextRunCrashPoint = growthFunction(game.runningMs + 100)
      if (nextRunCrashPoint >= game.crashPoint) {
        set('hotbox', 'state', 'Over', 1000000)
      }

      if (!game.rerunState) {
        set('hotbox', 'state', 'Over', 1000000)
      }

      game.runningMs = Date.now() - new Date(game.runningStartTime).getTime()
      if (currentCrashPoint >= 1.01) {
        cashoutActiveBetsForGame(game, currentCrashPoint)
      }

      // if we done, we done.
      if (!game.rerunState) {
        return { nextStateTimeout: 0, updatedGame: game }
      }

      const timeSpent = Date.now() - runStartTime
      const nextStateTimeout = 100 - Math.min(timeSpent, 100)
      return { nextStateTimeout, updatedGame: game }
    })
  },
  [states.Over]: async function (game: HotboxGame) {
    return instrument('states.Over', worker, async () => {
      set('hotbox', 'state', 'Over', 1000000)
      set('hotbox', 'id', game.id, 1000000)
      closeoutBetFeedIfExists(game)
      game = await updateGameReturnUpdated(game.id, {
        state: states.Over,
      })
      return { nextStateTimeout: overStateTime, updatedGame: game }
    })
  },
}

class Game {
  async run() {
    await instrument('buildGameHashTable', worker, async () => {
      await buildGameHashTable('hotbox', HotboxHashModel)
    })

    const gameState = await instrument(
      'initializeAndRecoverGameState',
      worker,
      async () => {
        return await initializeAndRecoverGameState()
      },
    )

    if (!gameState?.currentGame) {
      throw new Error('Unable to recover game state')
    }

    await this.processGameState(gameState.currentGame, gameState?.previousGame)
  }

  async processGameState(
    game: HotboxGame,
    previousGame: HotboxGame | undefined | null,
  ) {
    const stateTransitions = {
      [states.NotStarted]: StateTakingBets,
      [states.TakingBets]: StateRunning,
      [states.Running]: StateOver,
      [states.Over]: StateNotStarted,
    }

    const stateToRun = game?.rerunState
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
  hotboxStartTime = Date.now()

  // Start hotbox state manager.
  const game = new Game()
  game.run()

  // Start hotbox server orchestrator.
  const hotbox = new HotboxGameServerOrchestrator(name)
  hotbox.start()
}

export async function run() {
  runWorker(name, start)
}
