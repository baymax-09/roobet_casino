import moment from 'moment'

import { type Moment } from 'moment'

type TimeValue = Moment | string | number | Date
export type Duration =
  | 'y'
  | 'M'
  | 'w'
  | 'd'
  | 'h'
  | 'm'
  | 's'
  | 'ms'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years'
  | 'minutes'
  | 'seconds'
  | 'milliseconds'

/**
 * Returns a boolean determining if a time value is past a certain point in time.
 * @param {TimeValue} incomingTime - The time you want to know is after
 * @param {TimeValue} comparedTime -The time that you want to compare to ( to see if the first value is after)
 */
export const isAfter = (incomingTime: TimeValue, comparedTime: TimeValue) => {
  return moment(incomingTime).isAfter(comparedTime)
}

/**
 * Returns a boolean determining if a time value is before a certain point in time.
 * @param {TimeValue} incomingTime - The time you want to know is before
 * @param {TimeValue} comparedTime -The time that you want to compare to ( to see if the first value is before)
 */
export const isBefore = (incomingTime: TimeValue, comparedTime: TimeValue) => {
  return moment(incomingTime).isBefore(comparedTime)
}

/**
 * Returns a number in ms representing the even duration split between starttime and endtime
 * @param {TimeValue} startTime - The time you want to know is after
 * @param {TimeValue} endTime -The time that you want to compare to ( to see if the first value is after)
 * @param {number} dividedBy - The number you want to divide the duration by
 */
export const getEvenDuration = (
  startTime: TimeValue,
  endTime: TimeValue,
  dividedBy = 0,
) => {
  const start = moment.utc(startTime)
  const end = moment.utc(endTime)
  const diffInMs = Math.abs(moment(start).diff(end))
  return dividedBy === 0 ? dividedBy : diffInMs / dividedBy
}

/**
 * Returns an ISO String representing the endDateTime based on start and duration
 * @param {TimeValue} startDateTime
 * @param {number} gameDuration - Duration in MS
 * @param {number} multipliedBy - The number ( games.length ) to multiply duration by to determine the endDateTime
 * @returns {string}
 */
export const getCurrentDateTimeISO = () => {
  return moment().toISOString()
}

/**
 * Returns a Date representing the current time
 * @param {time} currentTime the date string or timestamp to be transformed. Defaults to new Date()
 * @param {span} decrementAmount
 * @param {unit} unitOfTime
 * @returns {Date}
 */
export const subtractTime = (
  span: number,
  unit: Duration,
  time: TimeValue = new Date(),
) => {
  return moment.utc(time).subtract(span, unit).toDate()
}

// Returns a number in ms
export const getDurationInMs = (inp: number, duration: Duration): number => {
  return moment.duration(inp, duration).as('ms')
}

/**
 * Returns a boolean if the time provided is before a certain time duration
 * @param {time} currentTime the date string or timestamp to be transformed.
 * @param {span} decrementAmount
 * @param {unit} unitOfTime
 * @returns {boolean}
 */
export const isBeforeDuration = (
  time: TimeValue,
  span: number,
  unit: Duration,
): boolean => {
  const beforeDuration = moment().subtract(span, unit)
  return moment(time).isBefore(beforeDuration)
}

/**
 * Returns an ISO String that is the a time in the future based on timeToAddInMs arg
 * @param {number} timeToSubtractInMs - ms as a number or string
 * @param {TimeValue} time - time you want to sub ms from, defaults to now if no value is provided.
 * @returns {Date}
 */
export const addTimeInMs = (
  timeToAddInMs: number | string,
  time: TimeValue = new Date(),
) => {
  return moment.utc(time).add(timeToAddInMs, 'ms').toDate()
}

/**
 * Returns an Date that is the a time in the future based on timeToAddInMs arg
 * @param {number} frequency - number of X time duration you want to add
 * @param {Duration} type - type of time duration you want to add
 * @param {TimeValue} time - time you want to sub ms from, defaults to now if no value is provided.
 * @returns {Date}
 */
export const addTimeInDuration = (
  frequency: number,
  duration: Duration,
  time: TimeValue = new Date(),
) => {
  return moment.utc(time).add(frequency, duration).toDate()
}

/**
 * Returns an ISO String that is the a time in the past based on timeToAddInMs arg
 * @param {number} timeToSubtractInMs - ms as a number or string
 * @param {TimeValue} time - time you want to sub ms from, defaults to now if no value is provided.
 * @returns {Date}
 */
export const subtractTimeInMs = (
  timeToSubtractInMs: number | string,
  time: TimeValue = new Date(),
) => {
  return moment.utc(time).subtract(timeToSubtractInMs, 'ms').toDate()
}

/**
 * Returns a boolean determining if a time value is between two other time values
 * @param {TimeValue} isBetween - the date you want to know is between
 * @param {TimeValue} startTime - Time you want to start with
 * @param {TimeValue} endTime - Time you want to end with
 * @returns {boolean}
 */
export const timeIsBetween = (
  isBetween: TimeValue,
  startTime: TimeValue,
  endTime: TimeValue,
) => {
  return moment.utc(isBetween).isBetween(startTime, endTime)
}

/**
 * Applies the system timezone (default: America/Chicago) to a given timestamp
 * @param {TimeValue} timestamp - the date you want to transform
 * @returns {Date}
 */
export const addSystemTimezone = (timestamp: TimeValue): Date => {
  const timezoneAgnosticDateString = moment(timestamp).format(
    'YYYY-MM-DDTHH:mm:ss',
  )
  return moment.tz(timezoneAgnosticDateString, 'America/Chicago').toDate()
}

/**
 * Returns unix time in number format
 * @param timestamp - JS Date or number
 * @returns {Date}
 */
export const getUnixTimeFromDate = (timestamp: Date): number => {
  return moment(timestamp).unix()
}
