import { Game } from 'src/modules/roulette'
import { buildGameHashTable } from 'src/modules/game'
import { runWorker } from 'src/util/workerRunner'

import { RouletteHashModel } from '../documents/roulette_games'

async function start() {
  await buildGameHashTable('roulette', RouletteHashModel)
  const game = new Game()
  await game.run()
}

export async function run() {
  runWorker('roulette', start)
}
