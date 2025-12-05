import { type DiceMode } from './dice_modes'

/**
 * calculate multiplier using config.dice.edge, targetNumber and rollOver
 */
export function calculatePayoutMultiplier(
  mode: DiceMode,
  edge: number,
  targetNumber: number,
  targetNumberEnd: number,
  targetNumber2: number,
  targetNumberEnd2: number,
) {
  let winningChance = 0

  switch (mode) {
    case 'over':
      winningChance = 99.99 - targetNumber
      break
    case 'under':
      winningChance = targetNumber
      break
    case 'between':
      // We subtract 0.01 because the target numbers are exclusive
      winningChance = targetNumberEnd - targetNumber - 0.01
      break
    case 'outside':
      winningChance = 99.99 - (targetNumberEnd - targetNumber)
      break
    case 'between-sets':
      // Summing the two ranges is OK because the second set of numbers has no overlap with the first set of numbers
      // -- This is checked for at the input validation step.
      // We subtract 0.01 from each range because the target numbers are exclusive.
      winningChance =
        targetNumberEnd -
        targetNumber -
        0.01 +
        (targetNumberEnd2 - targetNumber2 - 0.01)
      break
    default:
      throw new Error('Invalid dice mode: ' + mode)
  }

  const payout = (100.0 - edge) / winningChance

  return parseFloat(payout.toFixed(4))
}

export function determineRollSuccess(
  roll: number,
  mode: DiceMode,
  targetNumber: number,
  targetNumberEnd: number,
  targetNumber2: number,
  targetNumberEnd2: number,
) {
  switch (mode) {
    case 'over':
      return roll > targetNumber
    case 'under':
      return roll < targetNumber
    case 'between':
      return roll > targetNumber && roll < targetNumberEnd
    case 'outside':
      return roll < targetNumber || roll > targetNumberEnd
    case 'between-sets':
      return (
        (roll > targetNumber && roll < targetNumberEnd) ||
        (roll > targetNumber2 && roll < targetNumberEnd2)
      )
    default:
      throw new Error('Invalid dice mode: ' + mode)
  }
}
