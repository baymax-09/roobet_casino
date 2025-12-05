import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
  ApolloLink,
  type Operation,
  type NextLink,
  concat,
} from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

import { omitDeep } from 'common/util'
import { env } from 'common/constants'

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        tpGameBlocks: {
          merge(_, incoming) {
            return incoming
          },
        },
        slotPotatoes: {
          merge(_, incoming) {
            return incoming
          },
        },
        tpGamesGetAll: {
          merge(_, incoming) {
            return incoming
          },
        },
        gameTagsNotCached: {
          merge(_, incoming) {
            return incoming
          },
        },
        houseInventory: {
          merge(_, incoming) {
            return incoming
          },
        },
        inventoryItemRewards: {
          merge(_, incoming) {
            return incoming
          },
        },
        questTemplates: {
          merge(_, incoming) {
            return incoming
          },
        },
        bonusCodes: {
          merge(_, incoming) {
            return incoming
          },
        },
      },
    },
    GameTag: {
      fields: {
        games: {
          merge(existing, incoming) {
            return incoming
          },
        },
      },
    },
  },
})

/**
 * Removing every '__typename' field from the variables in our mutations. The problem is
 * that we don't actually check the for __typename in the inputTypes we create in Nexus, so our
 * mutations will fail if __typename is included. When we have nested objects that have __typename,
 * this becomes tedious and annoying to remove this field from all objects in every place.
 * This link will remove the __typename from all objects, and nested objects, to assure that the
 * mutations don't get rejected from the schema validation.
 */

const removeTypenameFromMutation = (
  operation: Operation,
  forward: NextLink,
) => {
  const definition = operation?.query?.definitions.filter(
    def => def.kind === 'OperationDefinition',
  )?.[0]
  if (
    definition?.kind === 'OperationDefinition' &&
    definition?.operation === 'mutation'
  ) {
    operation.variables = omitDeep(operation.variables, '__typename')
    return forward(operation)
  }
  return forward(operation)
}

const removeTypenameFromMutationLink = new ApolloLink(
  removeTypenameFromMutation,
)

export const getAdminApolloClient = user => {
  const httpLink = createHttpLink({
    uri: `${env.API_URL}/admin/graphql`,
    fetchOptions: {
      credentials: 'include',
    },
  })

  const wsLink =
    typeof window !== 'undefined'
      ? new GraphQLWsLink(
          createClient({
            url: `${env.WS_API_URL}:${env.WS_GQL_ADMIN_PORT}/admin/graphql`,
            connectionParams: {
              socketToken: user?.socketToken,
            },
          }),
        )
      : null

  const link = concat(
    removeTypenameFromMutationLink,
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

  return new ApolloClient({
    cache,
    link,
  })
}
