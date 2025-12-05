import { type Binary, type Timestamp } from 'bson'
import { type ClientSession, Mongoose } from 'mongoose'

import { TransactionInstrumentor } from 'src/util/instrumentation'

import { config } from './config'
import { scopedLogger } from './logger'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type MongooseClass = typeof import('mongoose')

type WithTransactionReturnType =
  | {
      ok: number
      $clusterTime: {
        clusterTime: Timestamp
        signature: {
          hash: Binary
          keyId: number
        }
      }
      operationTime: Timestamp
    }
  | undefined

export const mongoose = new Mongoose()
export const megaloMongo = new Mongoose()
export const mongoAnalytics = new Mongoose()
export const megaloMongoAnalytics = new Mongoose()

export interface MongoConnections {
  roobetMongoConn: MongooseClass
  megaloMongoConn: MongooseClass
  mongoAnalyticsConn: MongooseClass
  megaloMongoAnalyticsConn: MongooseClass
}

export const MongoErrorCodes = {
  DUPLICATE_KEY: 11000,
} as const

export class WithTransactionError extends Error {
  constructor() {
    super()
    this.name = 'WithTransactionError'
    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

/*
 * initializeMongo connects all of our different mongoose instances to the server.
 * It will only return after they all successfully established a connection, but error out if none can be made
 */
export async function initializeMongo(): Promise<MongoConnections> {
  const [
    roobetMongoConn,
    megaloMongoConn,
    mongoAnalyticsConn,
    megaloMongoAnalyticsConn,
  ] = await Promise.all([
    mongoose.connect(config.mongodb.uri),
    megaloMongo.connect(config.megalomongo.uri),
    mongoAnalytics.connect(config.mongo_analytics.uri),
    megaloMongoAnalytics.connect(config.megalomongo_analytics.uri),
  ])
  return {
    roobetMongoConn,
    megaloMongoConn,
    mongoAnalyticsConn,
    megaloMongoAnalyticsConn,
  }
}

type Handler<Return> = (
  withSession: <Result>(
    writeFunction: (session: ClientSession) => Result,
    debugObject?: Record<string, any>,
  ) => Promise<Result>,
) => Promise<Return>

const instrument = TransactionInstrumentor(
  'mongodb',
  config.datadog.threshold.mongodbSlowOperationThresholdSeconds,
)

const logger = scopedLogger('system/mongo')('withTransaction', { userId: null })
/**
 * Mongo transaction wrapper.
 */
export const withTransaction = async <Return>(
  handler: Handler<Return>,
  mongoConnection?: MongooseClass,
  passedInSession?: ClientSession,
): Promise<Return> => {
  const connection = mongoConnection ?? mongoose
  const session = passedInSession || (await connection.startSession())

  const withSession = async <Result>(
    writeFunction: (session: ClientSession) => Result,
    debugObject: Record<string, any> = {},
  ): Promise<Result> => {
    try {
      const endMeasurement = instrument.start()
      const res = await writeFunction(session)
      endMeasurement()
      return res
    } catch (error) {
      if (!passedInSession) {
        // Abort the entire tx.
        await session.abortTransaction()
      }
      // Log to kibana.
      logger.error('Error in withSession', debugObject, error)
      throw new Error(error)
    }
  }
  let handlerResult: Return | null = null

  if (passedInSession) {
    return await handler(withSession)!
  }

  // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
  const commitResult = (await session.withTransaction(async () => {
    handlerResult = await handler(withSession)
    // TS: The return type is wrong here...
  })) as unknown as WithTransactionReturnType

  if (commitResult && !commitResult.ok) {
    logger.error('Error with commit result in withTransaction')
    throw new WithTransactionError()
  }

  // End our session that has one completed transaction.
  await session.endSession()

  // TS: Force this to have a value of `Return` since we did not
  // meet the above commitResult condition and throw.
  return handlerResult!
}

export function mongoHealthCheck() {
  try {
    const mongoHealth = {
      mongooseHealth: mongoose.connection.readyState === 1,
      megaloMongoHealth: megaloMongo.connection.readyState === 1,
      mongoAnalyticsHealth: mongoAnalytics.connection.readyState === 1,
      megaloMongoAnalyticsHealth:
        megaloMongoAnalytics.connection.readyState === 1,
    }
    return mongoHealth
  } catch (error) {
    if (error instanceof Error && 'message' in error) {
      return { mongoHealth: error.message }
    } else {
      return { mongoHealthCheck: false }
    }
  }
}
