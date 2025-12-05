import { type APIValidationError } from 'src/util/errors'

const errorMap = {
  'insufficient balance': {
    status: 412,
    code: 100,
  },
  'player disabled': {
    status: 412,
    code: 110,
  },
  'player deleted': {
    status: 412,
    code: 110,
  },
  'game disabled': {
    status: 412,
    code: 405,
  },
  'max bet exceeded': {
    status: 412,
    code: 106,
  },
  'invalid currency': {
    status: 412,
    code: 154,
  },
  unknown: {
    status: 500,
    code: 500,
  },
} as const

type ErrorKey = keyof typeof errorMap
type ErrorMessage = (typeof errorMap)[ErrorKey]
const isKnownError = (error: string): error is ErrorKey => {
  return Object.keys(errorMap).includes(error)
}
interface Success {
  status: 200
  code: 0
}
export type StatusCode = ErrorMessage | Success

export const getErrorStatusCode = (
  error: string | APIValidationError,
): ErrorMessage => {
  if (typeof error === 'string') {
    return isKnownError(error) ? errorMap[error] : errorMap.unknown
  }

  if (error.message === 'bet__not_enough_balance') {
    return errorMap['insufficient balance']
  }

  return errorMap.unknown
}
