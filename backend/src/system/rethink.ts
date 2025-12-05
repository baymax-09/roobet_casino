import rethinkdbdash from 'rethinkdbdash'
// @ts-expect-error https://github.com/neumino/rethinkdbdash/blob/7421553ea98a0874a54980505966383e75d2973f/lib/protodef.js
import protodef from 'rethinkdbdash/lib/protodef'
import { validate as uuidValidate } from 'uuid'

import { config } from './config'
import { scopedLogger } from './logger/winston'
import { instrumentRethink } from 'src/util/trace'
import { traverseArrayWithinArray } from 'src/util/helpers/lists'
import { TransactionInstrumentor } from 'src/util/instrumentation'

const rethinkLogger = scopedLogger('system/rethink')
const logger = rethinkLogger('rethinkdbdash', { userId: null })
/**
 * The rethinkdbdash package is incredibly defective. It sends all logs with the same log level.
 * You are able to inject your own logger, but it accepts a single function and not the normal logger
 * interface that has different levels. To allow us to have correct error monitoring, we are injecting
 * our own logic. "Creating a pool connected to" seems to be the only informational log in the package
 * and this package will most likely never change again.
 * @see https://github.com/neumino/rethinkdbdash/blob/7421553ea98a0874a54980505966383e75d2973f/lib/helper.js#L7
 * @see https://github.com/neumino/rethinkdbdash/blob/7421553ea98a0874a54980505966383e75d2973f/README.md?plain=1#L274
 */
const rethinkdbdashLogger = (message: string) => {
  if (message.includes('Creating a pool connected to')) {
    logger.info(message)
  } else {
    logger.error(message)
  }
}

export const r = rethinkdbdash({
  ...config.rethinkdb,
  silent: true,
  log: rethinkdbdashLogger,
})

const initialTermTypes = protodef.Term.TermType as Record<string, number>
const termTypes = Object.entries(initialTermTypes).reduce<
  Record<number, string>
>((flippedObj, [key, value]) => {
  flippedObj[value] = key
  return flippedObj
}, {})

// @ts-expect-error Property '_Term' does not exist on type 'RethinkDBDash'
const termPrototype = r._Term.prototype
const originalRun = Reflect.get(termPrototype, 'run')
const instrument = TransactionInstrumentor(
  'rethinkdb',
  config.datadog.threshold.rethinkdbSlowOperationThresholdSeconds,
)

const modifiedRun = async function (...args: any[]) {
  const endMeasurement = instrument.start()

  let query = ''
  // @ts-expect-error 'this' implicitly has type 'any' because it does not have a type annotation.
  traverseArrayWithinArray<number | object | string>(this._query, element => {
    // Ignore { returnChanged: 'true'} and user id's
    if (typeof element === 'object') {
      return
    }
    if (typeof element === 'string' && uuidValidate(element)) {
      return
    }
    if (typeof element === 'number') {
      const termType = termTypes[element]
      if (termType) {
        query += termType + ' '
        return
      }
    }
    query += element + ' '
  })

  const res = await instrumentRethink(
    query,
    // @ts-expect-error 'this' implicitly has type 'any' because it does not have a type annotation.
    async () => await Reflect.apply(originalRun, this, args),
  )
  const querySting = 'rtdbQuery: ' + query

  endMeasurement({}, querySting)
  return res
}

// Set the modified run function on the Term prototype using Reflect.set
Reflect.set(termPrototype, 'run', modifiedRun)

export const rethinkHealthCheck = async () => {
  try {
    const pingResult = await r.table('settings').run()
    const result = {
      rethinkHealth: pingResult.length > 0,
    }
    return result
  } catch (error) {
    scopedLogger('rethink')('rethinkHealthCheck', { userId: null }).error(
      'rethinkHealthCheck error',
      {},
      error,
    )
    if (error instanceof Error && 'message' in error) {
      return { rethinkHealth: error.message }
    } else {
      return { rethinkHealthCheck: false }
    }
  }
}
