import { type GraphQLResolveInfo } from 'graphql'
import {
  plugin,
  printedGenTyping,
  printedGenTypingImport,
} from 'nexus/dist/core'

import { type Context } from 'src/util/graphql'
import { typeImportPath } from '../lib/plugins'

interface Header {
  name: string
  value: string
}

export type HeaderParams = null | {
  /**
   * The custom headers to be added to the response.
   */
  getHeaders: (
    root: unknown, // Shouldn't ever be needed, but including it for completeness.
    args: unknown,
    ctx: Context,
    info: GraphQLResolveInfo,
  ) => Header[]
}

/**
 * Insert import statement inside generated nexus file.
 */
const HeaderPluginImport = printedGenTypingImport({
  module: typeImportPath('headers'),
  bindings: ['HeaderParams'],
})

/**
 * Add `headers` property to field definitions.
 */
const fieldDefTypes = printedGenTyping({
  optional: true,
  name: 'headers',
  description: 'Custom header config for field.',
  type: 'HeaderParams',
  imports: [HeaderPluginImport],
})

export const headersPlugin = () =>
  plugin({
    name: 'HeadersPlugin',
    description: 'Adds custom headers to the response.',
    fieldDefTypes,
    onCreateFieldResolver: config => {
      return async (
        root,
        args,
        ctx: Context,
        info: GraphQLResolveInfo,
        next,
      ) => {
        const { fieldConfig } = config

        const params: HeaderParams | undefined =
          fieldConfig.extensions?.nexus?.config?.headers

        if (params) {
          const headers = params.getHeaders(root, args, ctx, info)

          headers.forEach(header => ctx.customHeaders.push(header))
        }

        return next(root, args, ctx, info)
      }
    },
  })
