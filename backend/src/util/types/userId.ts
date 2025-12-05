import * as t from 'io-ts'
import { UUID } from 'io-ts-types'

interface UserIdBrand {
  readonly UserId: unique symbol
}

const UserIdV = t.brand(
  t.string,
  (value): value is t.Branded<string, UserIdBrand> => typeof value === 'string',
  'UserId',
)

/** Used to encode, decode, and type guard userIds.  */
export const UserIdT = t.intersection([UUID, UserIdV])
/** Primitive string type that is a UUID and branded as a UserId specifically.  */
export type UserId = t.TypeOf<typeof UserIdT>
