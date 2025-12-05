import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { BatchHttpLink } from '@apollo/client/link/batch-http'
import sha1 from 'sha1'
import { print, visit, type DocumentNode } from 'graphql'

import { env } from 'common/constants'
import { TPGamesGetAllProductQuery, GameTagsQuery } from 'app/gql'

// We need to make sure that edge-cached queries are not batched.
const edgeCachedQueries = [TPGamesGetAllProductQuery, GameTagsQuery]

/*
 * This function checks if the operation is part of the edgeCachedQueries.
 * It iterates over each node in edgeCachedQueries and finds the first definition that is an OperationDefinitionNode.
 * If such a definition is found, it compares the name of the operationNode with the name of the operation definition.
 * If the names match, it returns true, indicating that the operation is an edge cache request.
 */
const isCachedQueryRequest = operation => {
  if (!operation.query) {
    return false
  }
  const definition = getMainDefinition(operation.query)
  if (!definition) {
    return false
  }
  const operationName = definition.name?.value
  return edgeCachedQueries.some(node => {
    const nodeDefinition = getMainDefinition(node)
    const nodeOperationName = nodeDefinition.name?.value
    return nodeOperationName === operationName
  })
}

// Traverse the AST and remove __typename from each selection set
const modifyQueryDocument = (doc: DocumentNode) =>
  visit(doc, {
    Field(node) {
      if (node.name.value === '__typename') {
        // This will remove the node from the AST
        return null
      }
      // This will keep the node in the AST
      return node
    },
  })

// Define a custom printer to format the query exactly as it is formatted on the server
const customPrinter = (doc: DocumentNode) => {
  const printedQuery = print(doc)
  const lines = printedQuery.split('\n')
  const indentedLines = lines.map(line => `  ${line}`)
  return `\n${indentedLines.join('\n')}\n\n`
}

const getCachedQueryHeaders = operation => {
  const definition = getMainDefinition(operation.query)
  const modifiedQueryDocument = modifyQueryDocument(operation.query)
  const queryText = customPrinter(modifiedQueryDocument)
  const operationName = definition.name?.value
  const args = operation.variables
  const cacheKey = sha1(
    [operationName, JSON.stringify(args), queryText].join(':'),
  )

  return { 'X-Roobet-Cache': cacheKey }
}

const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url: `${env.WS_API_URL}:${env.WS_GQL_PRODUCT_PORT}/graphql`,
        }),
      )
    : null

const baseLinkOptions = {
  uri: `${env.API_URL}/graphql`,
  credentials: 'include',
}

const headerLink = setContext(operation => {
  const baseHeaders = {
    'accept-language': localStorage.getItem('i18nextLng') ?? 'en',
  }

  if (isCachedQueryRequest(operation)) {
    const cacheHeaders = getCachedQueryHeaders(operation)
    return {
      headers: {
        ...baseHeaders,
        ...cacheHeaders,
      },
    }
  }

  return {
    headers: baseHeaders,
  }
})

const batchHttpLink = new BatchHttpLink({
  ...baseLinkOptions,
  batchMax: 5,
  batchInterval: 20,
})

const serialHttpLink = new HttpLink(baseLinkOptions)
const httpLink = split(isCachedQueryRequest, serialHttpLink, batchHttpLink)

const link = headerLink.concat(
  typeof window !== 'undefined' && wsLink !== null
    ? split(
        ({ query }) => {
          const def = getMainDefinition(query)
          return (
            def.kind === 'OperationDefinition' &&
            def.operation === 'subscription'
          )
        },
        wsLink,
        httpLink,
      )
    : httpLink,
)

export const productApolloClient = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          currentUser: {
            merge(existing, incoming, { mergeObjects }) {
              return mergeObjects(existing, incoming)
            },
          },
          tpGames: {
            merge(_, incoming) {
              return incoming
            },
          },
          tpGame: {
            merge(_, incoming) {
              return incoming
            },
          },
        },
      },
    },
  }),
  link,
})
