import * as t from 'io-ts'
import { Types } from 'mongoose'

export const ObjectIdV = new t.Type<Types.ObjectId>(
  'ObjectId',
  (id): id is Types.ObjectId => id instanceof Types.ObjectId,
  (id, context) =>
    t.string.is(id) && Types.ObjectId.isValid(id)
      ? t.success(new Types.ObjectId(id))
      : t.failure(id, context),
  t.identity,
)

export type ObjectId = t.TypeOf<typeof ObjectIdV>
