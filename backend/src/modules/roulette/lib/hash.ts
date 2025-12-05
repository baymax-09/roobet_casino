import { determineSingleFeatureAccess } from 'src/util/features'

import {
  isOutcomeValue,
  type OutcomeValue,
  type WinningNumber,
} from '../constant/roulette'
import { rouletteLogger } from './logger'

interface GameResult {
  winningNumber: WinningNumber
  spinNumber: OutcomeValue
}

export async function gameResultFromHash(
  seed: string,
): Promise<GameResult | undefined> {
  const logger = rouletteLogger('gameResultFromHash', { userId: null })
  const result = parseInt(seed.substr(0, 52 / 4), 16) % 15
  if (!isOutcomeValue(result)) {
    logger.error('Failed to create valid outcome result for new roulette game')
    return
  }
  const rouletteRework = await determineSingleFeatureAccess({
    countryCode: '',
    featureName: 'housegames:roulette',
  })
  if (rouletteRework) {
    return gameResultFromHashWithRoulette(result)
  }
  if (result === 0) {
    return { winningNumber: 3, spinNumber: result }
  }
  if (result <= 7) {
    return { winningNumber: 1, spinNumber: result }
  }
  if (result <= 14) {
    return { winningNumber: 2, spinNumber: result }
  }
  logger.error('Failed to create valid outcome result for new roulette game')
}

const gameResultFromHashWithRoulette = (
  result: OutcomeValue,
): GameResult | undefined => {
  if (result === 0) {
    return { winningNumber: 3, spinNumber: result }
  }
  if (result <= 6) {
    return { winningNumber: 1, spinNumber: result }
  }
  if (result <= 8) {
    return { winningNumber: 4, spinNumber: result }
  }
  if (result <= 14) {
    return { winningNumber: 2, spinNumber: result }
  }
  rouletteLogger('gameResultFromHashWithRoulette', { userId: null }).error(
    'Failed to create valid outcome result for new roulette game',
  )
}
