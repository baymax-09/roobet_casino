import { plugin, printedGenTyping } from 'nexus/dist/core'
import { parse, print, visit, type DocumentNode } from 'graphql'
import sha1 from 'sha1'

import { type Context } from 'src/util/graphql'

/**
 * Add `cached` property to field definitions.
 */
const fieldDefTypes = printedGenTyping({
  optional: true,
  name: 'cached',
  description: 'Cache validation flag for field.',
  type: 'boolean',
})

const getExpectedCacheKey = (
  context: Context,
  oldCacheKey: boolean = false,
): string => {
  const { query, operationName, variables } = context.body as {
    query: string
    operationName: string
    variables: Record<string, unknown>
  }

  // Parse the query to a GraphQL AST
  const queryDocument = parse(query)

  // Traverse the AST and remove __typename from each selection set
  const modifiedQueryDocument = visit(queryDocument, {
    Field(node) {
      if (node.name.value === '__typename') {
        // This will remove the node from the AST
        return null
      }
      // This will keep the node in the AST
      return node
    },
  })

  // Define a custom printer to format the query exactly as it is formatted on the client
  const customPrinter = (doc: DocumentNode) => {
    const printedQuery = print(doc)
    const lines = printedQuery.split('\n')
    const indentedLines = lines.map(line => `  ${line}`)
    return `\n${indentedLines.join('\n')}\n\n`
  }

  // Convert the modified AST back to a string using the custom printer
  const clientQuery = customPrinter(modifiedQueryDocument)

  // TODO: Remove "oldCacheKey" after a couple days of getting clients to new cache key.
  const value = oldCacheKey ? variables : JSON.stringify(variables)
  const expectedCacheKey = sha1([operationName, value, clientQuery].join(':'))

  return expectedCacheKey
}

export const cacheValidatorPlugin = () =>
  plugin({
    name: 'CacheValidatorPlugin',
    description: 'Validates the cache key required for edge caching.',
    fieldDefTypes,
    onCreateFieldResolver(config) {
      return async (root, args, context, info, next) => {
        const { fieldConfig } = config

        const cached: boolean | undefined =
          fieldConfig.extensions?.nexus?.config?.cached

        if (cached) {
          const cacheKey = context.headers['x-roobet-cache']
          const expectedCacheKey = getExpectedCacheKey(context, false)
          // TODO: Remove "oldExpectedCacheKey" after a couple days of getting clients to new cache key.
          const oldExpectedCacheKey = getExpectedCacheKey(context, true)

          const validHeader =
            cacheKey &&
            cacheKey.length > 0 &&
            (cacheKey === expectedCacheKey || cacheKey === oldExpectedCacheKey)

          if (!validHeader) {
            throw new Error('Invalid cache key')
          }
        }

        return next(root, args, context, info)
      }
    },
  })
