import * as t from 'io-ts'

const validBooleans = ['true', 'false', '0', '1']

/** @todo expand validators to more types */
const validators = {
  boolean: data => validBooleans.includes(`${data}`.toLowerCase()),
  number: data => !isNaN(data) && t.number.is(data),
  string: t.string.is,
  image: t.string.is,
} as const

export const validate = (data, type) => {
  if (type) {
    if (type in validators) {
      return validators[type](data)
    }
    return false
  }
  return true
}
