import { type HiloMode } from './hilo_modes'

/**
 * calculate multiplier using mode, edge, targetNumber
 */
export function calculatePayoutMultiplier(
  mode: HiloMode,
  edge: number,
  targetNumber: number,
) {
  let winningChance = 0

  switch (mode) {
    case 'over':
      winningChance = 100.0 - targetNumber
      break
    case 'under':
      winningChance = targetNumber
      break
    default:
      throw new Error('Invalid hilo mode: ' + mode)
  }

  const payout = (100.0 - edge) / winningChance

  return parseFloat(payout.toFixed(4))
}

export function determineRollSuccess(
  roll: number,
  mode: HiloMode,
  targetNumber: number,
) {
  switch (mode) {
    case 'over':
      return roll > targetNumber
    case 'under':
      return roll < targetNumber
    default:
      throw new Error('Invalid hilo mode: ' + mode)
  }
}
