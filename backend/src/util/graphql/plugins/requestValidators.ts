import { type GraphQLResolveInfo } from 'graphql'
import { GraphQLError } from 'graphql'
import { type GetGen } from 'nexus/dist/core'
import {
  plugin,
  printedGenTyping,
  printedGenTypingImport,
} from 'nexus/dist/core'
import { type AsyncOrSync } from 'ts-essentials'

import { typeImportPath } from '../lib/plugins'

interface ValidResult {
  valid: true
}
interface InvalidResult {
  valid: false
  error: string
}
type ValidatorResult = ValidResult | InvalidResult

export type Validator = (
  source: any,
  args: any,
  context: GetGen<'context'>,
  info: GraphQLResolveInfo,
) => AsyncOrSync<ValidatorResult>

export type RequestValidatorsParams = null | {
  validators: Validator[]
}

/**
 * Insert import statement inside generated nexus file.
 */
const RequestValidatorsPluginImport = printedGenTypingImport({
  module: typeImportPath('requestValidators'),
  bindings: ['RequestValidatorsParams'],
})

/**
 * Add `validate` property to field definitions.
 */
const fieldDefTypes = printedGenTyping({
  optional: true,
  name: 'requestValidators',
  description: 'The field type definition for the RequestValidatorsPlugin.',
  type: 'RequestValidatorsParams',
  imports: [RequestValidatorsPluginImport],
})

export const requestValidatorsPlugin = () =>
  plugin({
    name: 'RequestValidatorsPlugin',
    description:
      'A list of arbitrary request validators that either permit or reject processing the field.',
    fieldDefTypes,
    onCreateFieldResolver: config => {
      const { fieldConfig } = config

      const params: RequestValidatorsParams | undefined =
        fieldConfig.extensions?.nexus?.config?.requestValidators

      if (!params) {
        return undefined
      }

      return async (source, args, context, info, next) => {
        // Run each request validator concurrently. If any of them resolve with
        // a invalid flag or error message, do not process the remaining fields.
        const { validators } = params

        const promises = await Promise.allSettled(
          validators.map(validator => {
            return validator(source, args, context, info)
          }),
        )

        // Map thrown promises to valid validator results.
        const results = promises.map<ValidatorResult>(promise => {
          if (promise.status === 'fulfilled') {
            return promise.value
          }

          const error = ((): string => {
            if (typeof promise.reason === 'string') {
              return promise.reason
            }

            if (promise.reason instanceof Error) {
              return promise.reason.message
            }

            return 'Invalid request.'
          })()

          return {
            valid: false,
            error,
          }
        })

        const invalid = results.filter(
          (result): result is InvalidResult => !result.valid,
        )

        if (invalid.length > 0) {
          throw new GraphQLError('Invalid request.', {
            extensions: {
              requestValidators: {
                valid: false,
                errors: invalid.map(({ error }) => error),
              },
            },
          })
        }

        return plugin.completeValue(
          undefined,
          () => next(source, args, context, info),
          err => {
            if (err instanceof Error) {
              throw err
            }
          },
        )
      }
    },
  })
