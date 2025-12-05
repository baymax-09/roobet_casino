import processChangefeed, {
  type RethinkChangefeedOptions,
} from 'rethinkdb-changefeed-reconnect'
import { type RethinkChangefeedHandler } from 'rethinkdbdash'
import { hotboxLogger } from '../logger'

/**
 * Watches a table for changes and attempts to reconnect after any errors
 */
export function watchRethinkDBChanges<T>(
  getChanges: () => any,
  onChange: RethinkChangefeedHandler<T>,
  options: RethinkChangefeedOptions,
) {
  const onError = (error: Error) => {
    hotboxLogger('watchRethinkDBChanges', { userId: null }).error(
      `watchRethinkDBChanges error`,
      {},
      error,
    )

    if (error && error.message && error.message.includes('cannot subscribe')) {
      setTimeout(() => {
        processChangefeed(getChanges, onChange, onError, options)
      }, 2000)
    }
  }

  processChangefeed(getChanges, onChange, onError, options)
}
