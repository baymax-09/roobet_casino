import { type Types } from 'mongoose'

export * from './context'
export * from './scalars'
export * from './args'
export * from './pubsub'
export * from './buildSchema'
export * from './express'

/**
 * To get around the weird sourceType config and nested imports.
 * @see ./scalars.ts
 */
type MongooseObjectId = Types.ObjectId
export { type MongooseObjectId }
