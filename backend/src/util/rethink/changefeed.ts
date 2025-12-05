import processChangefeed, {
  type RethinkChangefeedOptions,
} from 'rethinkdb-changefeed-reconnect'
import {
  type BaseDocument,
  type ChangeEvent,
  type RethinkChangefeedHandler,
  type RethinkChangefeed,
} from 'rethinkdbdash'

import { r, io, winston, config } from 'src/system'
import { scopedLogger } from 'src/system/logger'
import { sleep } from 'src/util/helpers/timer'

function newFeed(table: string) {
  return () => {
    return r.table(table).changes().run()
  }
}

function reconnectOpts(table: string, overrides = {}) {
  return Object.assign(
    config.rethinkdb.changefeedReconnectOptions,
    { changefeedName: table, logger: winston },
    overrides,
  )
}

export async function tableFeed<T>(
  tableName: string,
  eventName: string,
  onlyNew: boolean,
  processFunction?: (value: T) => any,
) {
  const handleChange = async (change: ChangeEvent<T>) => {
    if (onlyNew && (!change || change.old_val)) {
      return
    }
    if (change && change.new_val) {
      const payload = processFunction
        ? await processFunction(change.new_val)
        : change.new_val
      if (payload) {
        io.emit(eventName, payload)
      }
    }
  }

  await recursiveChangefeedHandler<T>(
    newFeed(tableName),
    handleChange,
    reconnectOpts(tableName),
  )
}

const logger = scopedLogger('util/rethink')('recursiveChangefeedHandler', {
  userId: null,
})
export async function recursiveChangefeedHandler<T>(
  feed: RethinkChangefeed<T>,
  handleChange: RethinkChangefeedHandler<T>,
  reconnectOpts: RethinkChangefeedOptions,
) {
  const handleError = async (error: Error) => {
    if (error && error.message && error.message.includes('cannot subscribe')) {
      await sleep(2000)
      /*
       * i see multiple logs from the changefeed but im not sure if its actually happening
       * could be a bug
       */
      logger.info('recovering from fatal changefeed error', {}, error)
      await recursiveChangefeedHandler<T>(feed, handleChange, reconnectOpts)
    } else {
      logger.error('nonfatal changefeed error', {}, error)
    }
  }
  processChangefeed(feed, handleChange, handleError, reconnectOpts)
}

export async function tableChangeFeedCallback<T extends BaseDocument>(
  tableName: string,
  onlyNew: boolean,
  processFunction: RethinkChangefeedHandler<T>,
) {
  const cursor = await r.table<T>(tableName).changes().run()
  cursor.each(async function (_: unknown, change: ChangeEvent<T>) {
    if (onlyNew && (!change || change.old_val)) {
      return
    }
    if (change && change.new_val) {
      await processFunction(change)
    }
  })
  return cursor
}

export async function userTableFeed<T>(
  tableName: string,
  userKey: keyof T,
  eventName: string,
  includeDeleted = false,
  processFunction: ((value: T) => any) | null = null,
  onlyNew = false,
) {
  const handleChange = async (change: ChangeEvent<T>) => {
    // could optimize this to keep track of the changes in memory and thus lower load
    const userId = change.old_val
      ? change.old_val[userKey]
      : change.new_val
        ? change.new_val[userKey]
        : null
    if (!(userId && change)) {
      return
    }
    if (onlyNew && (!change || change.old_val)) {
      return
    }
    if (processFunction) {
      if (change.new_val) {
        change.new_val = await processFunction(change.new_val)
      }
      if (change.old_val && !onlyNew) {
        change.old_val = await processFunction(change.old_val)
      }
    }

    if (typeof userId === 'string') {
      if (change.new_val) {
        io.to(userId).emit(eventName, change)
      } else if (includeDeleted) {
        io.to(userId).emit(eventName, change)
      }
    }
  }

  await recursiveChangefeedHandler<T>(
    newFeed(tableName),
    handleChange,
    reconnectOpts(tableName),
  )
}
