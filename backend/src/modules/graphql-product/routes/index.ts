import { Router } from 'express'
import { expressMiddleware } from '@apollo/server/express4'

import { type RouterApp } from 'src/util/api'
import {
  verifyWellFormedGQLOperationsList,
  expressMiddlewareOptions,
  buildApolloServer,
  makeRootSchema,
} from 'src/util/graphql'

import { ProductGraph } from '../schema'

const productRootSchema = makeRootSchema(__dirname, ProductGraph)

export default async function (app: RouterApp) {
  const router = Router({ caseSensitive: true })

  const productServer = buildApolloServer(productRootSchema)

  await productServer.start()

  // By default, the product graphql is open to everyone.
  // Each query/mutation is responsible for authorization.
  app.use(
    '/graphql',
    verifyWellFormedGQLOperationsList,
    expressMiddleware(productServer, expressMiddlewareOptions),
  )

  return router
}
