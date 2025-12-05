import { type ValueOf } from 'ts-essentials'

export const StatusCodes = {
  OK: 0,
  NOUSER: 1,
  INTERNAL: 2,
  INVALIDCURRENCY: 3,
  WRONGUSERNAMEPASSWORD: 4,
  ACCOUNTLOCKED: 5,
  ACCOUNTDISABLED: 6,
  NOTENOUGHMONEY: 7,
  /** The system is unavailable for this request. Try again later. */
  MAXCONCURRENTCALLS: 8,
  /** Responsible gaming limit (money) exceeded. */
  SPENDINGBUDGETEXCEEDED: 9,
  SESSIONEXPIRED: 10,
  /** Responsible gaming limit (time) exceeded. */
  TIMEBUDGETEXCEEDED: 11,
  /** Service is unavailable for any reason but able to respond, similar to MAXCONCURRENTCALLS which is a specialized condition of SERVICEUNAVAILABLE. */
  SERVICEUNAVAILABLE: 12,
} as const

export type StatusCode = ValueOf<typeof StatusCodes>

export const SessionStates = {
  OPEN: 0,
  CLOSED: 1,
} as const
export type SessionState = ValueOf<typeof SessionStates>

export const TransactionTypes = {
  REAL: 0, // Real money.
  PROMOTIONAL: 1, // Promotional money. For example, the result of Free game spins.
}
