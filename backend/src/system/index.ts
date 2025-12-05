import * as Prometheus from 'prom-client'

import { initializeAWS } from './amazon'
import { migrate } from './schema'
import { config } from './config'
import { winston } from './logger'
import { initializeMongo } from './mongo'

// Don't add more exports here unless you are quite sure you understand the consequences.
export * from './config'
export { winston } from './logger/winston'
export * from './redis'
export * from './rethink'
export * from './mongo'
export * from './schema'
export * from './amazon'
export { rabbitMQHealthCheck } from './rabbitmq'
export * from './express'
export * from './sockets'

// For the time being, DO NOT MOVE THESE (you'll regret it)
import { loadExpressMiddleware, server, metricsServer } from './express'
import { loadSocketClient, loadSocketMiddleware } from './sockets'

export const prometheus = Prometheus

export async function initialize() {
  const dbConnections = await initializeMongo()

  migrate(dbConnections)

  initializeAWS()
  loadSocketClient()
  await loadExpressMiddleware()
}

export async function postBootstrap() {
  metricsServer.listen(config.metricsPort)
  server.listen(config.port, function () {
    winston.silly('Listening.')
  })
  await loadSocketMiddleware()
}
