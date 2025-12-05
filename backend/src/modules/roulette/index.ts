import { safeToShutdown } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'

import {
  generateGameTimestamps,
  payoutGame,
  initializeAndRecoverGameState,
  startNextGame,
  updateGameReturnUpdated,
  processRouletteJackpot,
} from './documents/roulette_games'
import {
  betStateTime,
  payoutStateTime,
  overStateTime,
} from './constant/roulette'
import { recordRouletteHistory } from './documents/roulette_history_mongo'
import { RouletteStates } from './constant/states'
import type * as Types from './types'
import { getActiveBetsForGame } from '../bet'
import { rouletteLogger } from './lib/logger'

export * as Documents from './documents'
export * as Routes from './routes'
export * as Types from './types'
export * as Workers from './workers'

const stateDefinitions: Types.RouletteGameStateDefinitions = {
  [RouletteStates.NotStarted]: async function (game, previousGame) {
    rouletteLogger('stateDefinitions', { userId: null }).info(
      'NotStarted state.',
      {
        game,
        previousGame,
      },
    )
    await payoutGame(game)
    await recordRouletteHistory(game)
    game = await startNextGame(game, previousGame)
    safeToShutdown()
    return { nextStateTimeout: 0, updatedGame: game }
  },

  [RouletteStates.TakingBets]: async function (game, previousGame) {
    const gameTimestamps = generateGameTimestamps()
    const update = {
      state: RouletteStates.TakingBets,
      ...gameTimestamps,
    }

    game = await updateGameReturnUpdated(game.id, update)

    return { nextStateTimeout: betStateTime, updatedGame: game }
  },

  // this is a misnomer, it actually pays out during Over state
  [RouletteStates.Payout]: async function (game, previousGame) {
    game = await updateGameReturnUpdated(game.id, {
      state: RouletteStates.Payout,
    })

    return { nextStateTimeout: payoutStateTime, updatedGame: game }
  },

  [RouletteStates.Over]: async function (game, previousGame) {
    game = await updateGameReturnUpdated(game.id, {
      state: RouletteStates.Over,
    })

    const activeBets = await getActiveBetsForGame(game.id)

    processRouletteJackpot(game, activeBets)

    return { nextStateTimeout: overStateTime, updatedGame: game }
  },
}

export class Game {
  async run() {
    const { currentGame, previousGame } = await initializeAndRecoverGameState()
    rouletteLogger('Game.run', { userId: null }).info(
      'Initialize and Recover Game State.',
      { currentGame, previousGame },
    )
    await this.processGameState(currentGame!, previousGame!)
  }

  async processGameState(
    game: Types.RouletteGame,
    previousGame: Types.RouletteGame,
  ) {
    const stateTransitions = {
      [RouletteStates.NotStarted]: RouletteStates.TakingBets,
      [RouletteStates.TakingBets]: RouletteStates.Payout,
      [RouletteStates.Payout]: RouletteStates.Over,
      [RouletteStates.Over]: RouletteStates.NotStarted,
    } as const

    const stateToRun = stateTransitions[game.state]
    const { nextStateTimeout, updatedGame } = await stateDefinitions[
      stateToRun
    ](game, previousGame)
    await sleep(nextStateTimeout)
    await this.processGameState(updatedGame, previousGame)
  }
}
