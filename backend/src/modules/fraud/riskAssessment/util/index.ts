import moment from 'moment'

export const formatSeonDob = (date: Date | string | undefined) => {
  // Best case scenario, we have the format we expect.

  if (date === undefined || date === '') {
    return ''
  }

  let parsed = moment(date, 'DD-MM-YYYY')

  // If not, let's just throw the string at moment and see what happens.
  if (!parsed.isValid()) {
    parsed = moment(date)
  }

  // Return undefined if it still isn't a valid date.
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : ''
}
