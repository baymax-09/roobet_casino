declare module 'rethinkdb-changefeed-reconnect' {
  import {
    type RethinkChangefeed,
    type RethinkChangefeedHandler,
    type RethinkChangefeedErrorHandler,
  } from 'rethinkdbdash'
  type LoggerFunction = (...args: any[]) => void

  export interface RethinkChangefeedOptions {
    changefeedName?: string
    attemptDelay?: number
    maxAttempts?: number
    silent?: boolean
    logger?: {
      warn: LoggerFunction
      info: LoggerFunction
      debug: LoggerFunction
      error: LoggerFunction
    }
  }

  export default function (
    feed: RethinkChangefeed,
    handleFeed: RethinkChangefeedHandler,
    handleError: RethinkChangefeedErrorHandler,
    options: RethinkChangefeedOptions,
  ): void
}
