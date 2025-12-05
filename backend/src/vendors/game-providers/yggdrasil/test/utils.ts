import { Types } from 'mongoose'
import * as logLib from '../../../../system/logger'

/**
 * Gets a silent mocked logger for testing logging.
 * @returns A silent mocked logger.
 */
export function getMockedLogger() {
  // Those are probably appropriate thoughts for a different time.
  const flogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    verbose: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn(),
  }
  jest.spyOn(logLib, 'scopedLogger').mockImplementation(_moduleName => {
    return (_scope, _context) => flogger as any
  })

  return flogger
}

let dateIncr = 0
/**
 * Gets a timestamp for testing with a forced gap of 500ms between calls.
 * @returns A {@link Date} object.
 */
export function getTimestamp(offsetSecs = 0): Date {
  const ret = new Date(Date.now() + dateIncr + offsetSecs * 1000)
  dateIncr += 500
  return ret
}

/**
 * Gets a random object ID.
 * @returns A random object ID as a `string`.
 */
export function getObjectIdValue() {
  return new Types.ObjectId().toString()
}
