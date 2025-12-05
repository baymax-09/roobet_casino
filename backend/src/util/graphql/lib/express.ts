import { type RequestHandler, type Request } from 'express'
import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { ApolloServerErrorCode } from '@apollo/server/errors'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import {
  type GraphQLSchema,
  type GraphQLError,
  type ValidationContext,
} from 'graphql'
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { ApolloArmor } from '@escape.tech/graphql-armor'

import { config, server, cacheClient, getBackendUrlFromReq } from 'src/system'
import { type Context } from 'src/util/graphql'
import { translateForUser, translateWithLocale } from 'src/util/i18n'
import { getIpFromRequest } from 'src/modules/fraud/geofencing'
import { scopedLogger } from 'src/system/logger'

import { buildContext } from './context'

const graphqlLogger = scopedLogger('graphql-api')

const gqlUnauthIpRateLimiter = new RateLimiterRedis({
  storeClient: cacheClient(),
  points: config.graphql.rateLimit.points, // Max message per duration
  duration: config.graphql.rateLimit.duration, // Per second(s)
  keyPrefix: 'gql-unauth',
  blockDuration: config.graphql.rateLimit.blockDuration,
})

export const expressMiddlewareOptions = {
  context: async ({ req }: { req: Request }) => buildContext(req),
}

const formatErrorMessage = (
  context: Pick<Context, 'user' | 'locale'>,
  message: string,
) => {
  if (!context) {
    return translateWithLocale(['en'], message)
  }

  return context.user
    ? translateForUser(context.user, message)
    : translateWithLocale(context.locale, message)
}

const logRejection = (ctx: ValidationContext | null, error: GraphQLError) => {
  graphqlLogger('graphql-api', { userId: null }).warn(
    'Rejected GQL operation',
    { ctx, monitorKey: 'rejectedGraphQLOperation' },
    error,
  )
}

export const verifyWellFormedGQLOperationsList: RequestHandler = (
  req,
  res,
  next,
) => {
  const logger = graphqlLogger('verifyWellFormedGQLOperationsList', {
    userId: req.user?.id ?? null,
  })
  // Skip all checks when using the Apollo Server Sandbox.
  if (!config.isProd) {
    const reqOrigin = req.headers.origin
    const apiOrigin = getBackendUrlFromReq(req)

    if (apiOrigin === reqOrigin) {
      next()
      return
    }
  }

  if (!Array.isArray(req.body) && Object.keys(req.body).length === 0) {
    req.body = []
  }

  const operations = Array.isArray(req.body) ? req.body : [req.body]

  ;(async () => {
    // We are rate limiting unauthenticated GQL operations by IP address.
    if (!req.user) {
      const ip = await getIpFromRequest(req)
      try {
        // Each requests consumes points equal to the number of GQL operations, not 1 per request
        await gqlUnauthIpRateLimiter.consume(ip, operations.length)
      } catch {
        res.status(500).send("You're doing that too fast. Please slow down")
        return
      }
    }

    if (operations.length > 5) {
      logger.warn('GraphQL operation batch over limit', {
        operations,
        length: operations.length,
      })
      res.status(500).send({
        errors: [
          {
            message: 'Internal Server Error',
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
            },
          },
        ],
      })
      return
    }

    next()
  })().catch(error => {
    logger.error('error', {}, error)
  })
}

export const buildApolloServer = (schema: GraphQLSchema) => {
  const armor = new ApolloArmor({
    // We would like to experiment with cost limit before enabling it
    costLimit: { propagateOnRejection: false, onReject: [logRejection] },
    maxAliases: {
      onReject: [logRejection],
      allowList: [],
    },
    // TODO if we stop abusing fragments, we should look into how this option work.
    maxDepth: { onReject: [logRejection], flattenFragments: true },
    maxDirectives: { onReject: [logRejection] },
    maxTokens: { onReject: [logRejection] },
    blockFieldSuggestion: {},
  })
  const protection = armor.protect()

  const apolloServer = new ApolloServer<Context>({
    // This should remain first so it can be predictably overridden.
    ...protection,
    schema,
    parseOptions: {
      noLocation: true,
    },
    allowBatchedHttpRequests: true,
    includeStacktraceInErrorResponses: !config.isProd,
    introspection: !config.isProd,
    // I know it seems weird to have one thing spread, but if someone added this field later and didn't spread we would
    // lose the field coming from graphql-armor protection spread above.
    validationRules: [...protection.validationRules],
    plugins: [
      ...protection.plugins,
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer: server }),

      // Disable sandbox on production.
      ...(config.isProd ? [ApolloServerPluginLandingPageDisabled()] : []),

      // Error handling.
      {
        async requestDidStart(context) {
          const {
            operationName,
            requestIsBatched,
            request: { variables, query },
          } = context
          graphqlLogger('GQL', {
            userId: context.contextValue.user?.id ?? null,
          }).info('Operation', {
            operationName,
            query,
            variables,
            requestIsBatched,
          })

          return {
            async didEncounterErrors(requestContext) {
              requestContext.errors.forEach(error => {
                const { user, locale } = requestContext.contextValue
                const translateContext = { user, locale }

                if (
                  error.extensions.code ===
                  ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED
                ) {
                  graphqlLogger('GQL', {
                    userId: context.contextValue.user?.id ?? null,
                  }).info(
                    'Operation Validation Failed',
                    {
                      operationName,
                      query,
                      variables,
                      requestIsBatched,
                      message: error.message,
                    },
                    error,
                  )
                  error.message = 'Internal Server Error'
                  error.extensions.code =
                    ApolloServerErrorCode.INTERNAL_SERVER_ERROR
                } else {
                  error.message = formatErrorMessage(
                    translateContext,
                    error.message,
                  )
                }
              })
            },
          }
        },
      },
      // Modify the response headers with the injected headers from the headers Nexus plugin.
      {
        async requestDidStart() {
          return {
            async willSendResponse(requestContext) {
              const { contextValue, response } = requestContext
              // Get the custom headers from the context response
              const customHeaders = contextValue?.customHeaders
              // Add these headers to the response
              if (customHeaders) {
                customHeaders.forEach(({ name, value }) => {
                  response.http.headers.set(name, value)
                })
              }
            },
          }
        },
      },
    ],
  })
  return apolloServer
}
