import 'src/system/tracer' // Must be imported first

import 'core-js/stable'
import 'regenerator-runtime/runtime'
import express from 'express'

import {
  config,
  app,
  metricsApp,
  io,
  passport,
  prometheus,
  initialize,
  postBootstrap,
} from 'src/system'
import { scopedLogger } from './system/logger'
import { healthCheckRequestHandler } from './util/middleware/healthCheck'

const bootstrapLogger = scopedLogger('bootstrap')

async function run() {
  // Initialize system
  await initialize()

  // Temporary, until we take care of the globals problem
  if (process.env.BOOTSTRAP_SYSTEM) {
    return
  }

  await postBootstrap()

  load()

  bootstrapLogger('run', { userId: null }).silly(
    'Mode: ' +
      config.mode +
      ', App: ' +
      config.app +
      ', Worker: ' +
      config.worker,
    {
      mode: config.mode,
      worker: config.worker,
      app: config.app,
    },
  )
}

function load() {
  metricsApp.get('/metrics', (req, res) => {
    prometheus.register
      .metrics()
      .then(metrics => {
        res.set('Content-Type', prometheus.contentType)
        res.end(metrics)
      })
      .catch(err => {
        res.status(500).end(err)
      })
  })

  metricsApp.get('/health', healthCheckRequestHandler)

  if (!config.worker || config.isLocal) {
    loadApi()
  }

  if (config.worker || config.isLocal) {
    loadWorker()
  }

  bootstrapLogger('load', { userId: null }).info('The app is ready!')
}

function loadApi() {
  require('./system/setup/routes').mountRoutes(app, passport, io, express)
  return true
}

function loadWorker() {
  require('./system/setup/workers')
  return true
}

process.on('SIGTERM', function () {
  bootstrapLogger('SIGTERM', { userId: null }).info('Shutting down')
  global.SHUTTING_DOWN = true
})

process.on('unhandledRejection', function (reason, promise) {
  bootstrapLogger('unhandledRejection', { userId: null }).error(
    'Unhandled Rejection',
    { reason, promise },
  )
})

process.on('uncaughtException', function (err) {
  bootstrapLogger('uncaughtException', { userId: null }).error(
    'Uncaught Exception',
    {},
    err,
  )
  process.exit(0)
})

run().catch(error => {
  bootstrapLogger('run', { userId: null }).error(
    'Error initializing',
    {},
    error,
  )
})
// TESTING
