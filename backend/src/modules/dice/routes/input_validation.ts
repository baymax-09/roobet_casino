import { APIValidationError } from 'src/util/errors'
import {
  needsTargetNumberEnd,
  needsTargetNumberSecondSet,
} from '../lib/dice_modes'

export function isValidTargetNumber(targetNumber: number) {
  if (targetNumber < 0.01 || targetNumber > 99.98) {
    return false
  }
  return true
}

export function validateRollInputs(
  clientSeed: any,
  amount: any,
  diceMode: any,
  targetNumber: any,
  targetNumberEnd: any = '',
  targetNumber2: any = '',
  targetNumberEnd2: any = '',
  balanceDelay: any,
) {
  if (typeof clientSeed !== 'string') {
    throw new APIValidationError('game__client_seed_must_be_string')
  }

  if (clientSeed.length > 25) {
    throw new APIValidationError('max__seed_len')
  }

  if (!amount) {
    throw new APIValidationError('supply__amount')
  }
  if (isNaN(amount)) {
    throw new APIValidationError('invalid_amount')
  }

  if (!targetNumber) {
    throw new APIValidationError('target__number')
  }
  if (isNaN(targetNumber)) {
    throw new APIValidationError('invalid__target')
  }

  const parsedTargetNumber = parseFloat(parseFloat(targetNumber).toFixed(2))

  if (!isValidTargetNumber(parsedTargetNumber)) {
    throw new APIValidationError('target__range')
  }

  if (needsTargetNumberEnd(diceMode)) {
    if (!targetNumberEnd) {
      throw new APIValidationError('target__number')
    }
    if (isNaN(targetNumberEnd)) {
      throw new APIValidationError('invalid__target')
    }
  }

  const parsedTargetNumberEnd = parseFloat(
    parseFloat(targetNumberEnd).toFixed(2),
  )

  if (needsTargetNumberEnd(diceMode)) {
    if (!isValidTargetNumber(parsedTargetNumberEnd)) {
      throw new APIValidationError('target__range')
    }

    // Number range must be greater than 0.02
    if (parsedTargetNumberEnd - parsedTargetNumber < 0.02) {
      throw new APIValidationError('target__range')
    }
  }

  if (needsTargetNumberSecondSet(diceMode)) {
    if (!targetNumber2) {
      throw new APIValidationError('target__number')
    }
    if (isNaN(targetNumber2)) {
      throw new APIValidationError('invalid__target')
    }
    if (!targetNumberEnd2) {
      throw new APIValidationError('target__number')
    }
    if (isNaN(targetNumberEnd2)) {
      throw new APIValidationError('invalid__target')
    }
  }

  const parsedTargetNumber2 = parseFloat(parseFloat(targetNumber2).toFixed(2))
  const parsedTargetNumberEnd2 = parseFloat(
    parseFloat(targetNumberEnd2).toFixed(2),
  )

  if (needsTargetNumberSecondSet(diceMode)) {
    if (!isValidTargetNumber(parsedTargetNumber2)) {
      throw new APIValidationError('target__range')
    }
    if (!isValidTargetNumber(parsedTargetNumberEnd2)) {
      throw new APIValidationError('target__range')
    }

    // Number range must be greater than 0.02
    if (parsedTargetNumberEnd2 - parsedTargetNumber2 < 0.02) {
      throw new APIValidationError('target__range')
    }

    // Check for overlap between the two sets of number ranges
    if (parsedTargetNumber2 < parsedTargetNumberEnd) {
      throw new APIValidationError('target__range')
    }
  }

  if (balanceDelay) {
    // Check that balanceDelay parses to an integer greater than or equal to 0
    if (!Number.isInteger(Number(balanceDelay)) || Number(balanceDelay) < 0) {
      throw new APIValidationError('balance_delay_invalid')
    }
  }
}
