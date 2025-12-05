import { type DBFeedFunction, loadFeeds } from 'src/modules'
import { runWorker } from 'src/util/workerRunner'
import { dbLogger } from './logger'

async function start() {
  const feeds: DBFeedFunction[] = loadFeeds()

  const names = feeds.map(feed => feed.name)
  const logger = dbLogger('genericFeeds', {
    userId: null,
  }).info(`[genericFeeds] Loading feeds: ${names}`)

  await Promise.all([...feeds.map(async loadFeed => await loadFeed())])

  logger.info('Feeds loaded.')
}

export async function run() {
  runWorker('genericFeeds', start)
}
