import { Router } from 'express'
import { expressMiddleware } from '@apollo/server/express4'

import { api, type RouterApp } from 'src/util/api'
import {
  buildApolloServer,
  expressMiddlewareOptions,
  makeRootSchema,
} from 'src/util/graphql'

import { AdminGraph } from '../schema'

const adminRootSchema = makeRootSchema(__dirname, AdminGraph)

export default async function (app: RouterApp) {
  const router = Router({ caseSensitive: true })

  const adminServer = buildApolloServer(adminRootSchema)

  await adminServer.start()

  app.use(
    '/admin/graphql',
    api.check,
    expressMiddleware(adminServer, expressMiddlewareOptions),
  )

  return router
}
