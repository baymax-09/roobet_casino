import { type YggdrasilError } from './errors'
import { type YggdrasilErrorResponse } from './responses'

/**
 * A string with a maximum and minimum length.
 */
export type LengthString<
  Max extends number,
  Min extends number = 0,
> = string & { _maxLength: Max; _minLength: Min }

/**
 * Determines if a fit a target range for length.
 * @param input The target string.
 * @param min The minimum length.
 * @param max The maximum length.
 * @returns True if the string is between {@link min} and {@link max} inclusive.
 */
export function isStringOfLength<Min extends number, Max extends number>(
  input: string,
  max: Max,
  min: Min,
): input is LengthString<Max, Min> {
  return input.length >= min && input.length <= max
}

/**
 * Validates a string with a maximum and minimum length.
 * @param input THe target string.
 * @param max The maximum length.
 * @param min The minimum length.
 * @returns The {@link input} string, if the length is between {@link min} and {@link max} inclusive.
 */
export function stringOfLength<Max extends number, Min extends number>(
  input: unknown,
  max: Max,
  min: Min,
  force = false,
): LengthString<Max, Min> {
  if (typeof input !== 'string') {
    throw new Error('Input MUST be a string')
  }

  const finalString = force ? input.slice(0, max) : input
  if (!isStringOfLength(finalString, max, min)) {
    throw new Error('Input string is not between specified min and max')
  }

  return finalString
}

/**
 * Converts a {@link YggdrasilError} to a {@link YggdrasilErrorResponse}.
 * @param error The {@link YggdrasilError error} to convert.
 * @returns The {@link YggdrasilErrorResponse response} from the error.
 */
export function yggdrasilErrorResponse(
  error: YggdrasilError,
): YggdrasilErrorResponse {
  return {
    code: error.code,
    msg: stringOfLength(error.message, 100, 0, true),
  }
}
