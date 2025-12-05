import { APIValidationError } from 'src/util/errors'
import { HiloModes } from '../lib/hilo_modes'

export function isValidTargetNumber(targetNumber: number) {
  if (targetNumber < 0.01 || targetNumber > 99.98) {
    return false
  }
  return true
}

export function validateRollInputs(
  clientSeed: any,
  amount: any,
  mode: any,
  targetNumber: any,
) {
  if (!HiloModes.includes(mode)) {
    throw new APIValidationError('invalid__mode')
  }

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
}
