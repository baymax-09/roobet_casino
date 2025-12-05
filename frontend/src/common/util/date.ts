import moment, { type MomentInput } from 'moment-timezone'

export function createMoment(date?: MomentInput) {
  return moment(date).tz('America/Chicago')
}

export const buildTimestampFilter = (
  start: MomentInput,
  end: MomentInput,
  useTime = false,
) => {
  let startTime = start ? moment(start) : undefined
  let endTime = end ? moment(end) : undefined
  if (!useTime) {
    if (startTime) {
      startTime = startTime.startOf('day')
    }
    if (endTime) {
      endTime = endTime.endOf('day')
    }
  }

  return JSON.parse(
    JSON.stringify({
      $gte: startTime ? startTime.toISOString() : undefined,
      $lte: endTime ? endTime.toISOString() : undefined,
    }),
  )
}

/**
 * Inverts the timezone offset on a local date object so it will
 * be displayed as if it is UTC to the client.
 * @param date The Date or Moment object to transform.
 * @returns The Date object with inverted utc offset.
 */
export const invertDateUTCOffset = (date?: MomentInput): Date => {
  const utcOffset = moment(date).utcOffset()
  // Invert the offset and return as Date
  return moment(date).utc().utcOffset(utcOffset, true).toDate()
}

/**
 * Transforms a local date to be stored as UTC. For example, if
 * 12:00-05:00 is passed in, this should return 12:00+00:00.
 * @param date The Date or Moment object to transform.
 * @param format The optional format to return the UTC string in.
 * @returns The date string as if it were UTC.
 */
export const coerceDateToUTCString = (
  date?: MomentInput,
  format?: string,
): string => {
  return moment(date).utcOffset(0, true).format(format)
}

export const fromNow = (endDate: Date) => {
  const now = new Date()
  const ended = endDate.getTime() - now.getTime() <= 0

  const differenceInMinutes = Math.abs(
    Math.ceil((endDate.getTime() - now.getTime()) / 60000),
  )

  const days = Math.floor(differenceInMinutes / (60 * 24))
  const hours = Math.floor(differenceInMinutes / 60)

  // Display Days
  if (days) {
    if (days !== 1) {
      return `${days} days`
    }
    return '1 day'
  }

  let timeString = ''
  // Display Hours
  if (hours) {
    if (hours === 1) {
      timeString += `${hours} hour `
    } else {
      timeString += `${hours} hours `
    }
    if (differenceInMinutes % 60 === 0) {
      return `${timeString.trimEnd()} ${ended ? ' ago' : ''}`
    }
  }
  // Display Minutes
  if (differenceInMinutes) {
    const minutes = differenceInMinutes % 60
    if (minutes === 1) {
      timeString += `${minutes} minute${ended ? ' ago' : ''}`
    } else {
      timeString += `${minutes} minutes${ended ? ' ago' : ''}`
    }
  }
  return timeString
}

export const convertDateToMonthDayYearFormat = (date: Date) => {
  return moment(date).format('MMMM Do YYYY')
}

export const convertDateToMonthDayFormat = (date: Date) => {
  return createMoment(date).format('MMMM Do')
}
