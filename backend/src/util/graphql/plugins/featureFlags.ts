import { GraphQLError } from 'graphql'
import {
  plugin,
  printedGenTyping,
  printedGenTypingImport,
} from 'nexus/dist/core'

import { type FeatureName } from 'src/util/features/types'
import { canUserAccessFeatures } from 'src/util/features'

import { typeImportPath } from '../lib/plugins'

/**
 * FeatureFlag parameters shape. The feature flag config is optional on all fields.
 */
export type FeatureFlagsParams = null | {
  /**
   * List of required feature flags to use feature. This is treated as an AND clause.
   */
  featureNames: FeatureName[]
}

/**
 * Insert import statement inside generated nexus file.
 */
const FeatureFlagPluginImport = printedGenTypingImport({
  module: typeImportPath('featureFlags'),
  bindings: ['FeatureFlagsParams'],
})

/**
 * Add `validate` property to field definitions.
 */
const fieldDefTypes = printedGenTyping({
  optional: true,
  name: 'featureFlags',
  description: 'Feature flag config for field.',
  type: 'FeatureFlagsParams',
  imports: [FeatureFlagPluginImport],
})

export const featureFlagPlugin = () =>
  plugin({
    name: 'FeatureFlagPlugin',
    description: 'Guards fields with feature flags.',
    fieldDefTypes,
    onCreateFieldResolver: config => {
      const { fieldConfig, parentTypeConfig } = config

      const params: FeatureFlagsParams | undefined =
        fieldConfig.extensions?.nexus?.config?.featureFlags

      if (!params) {
        return undefined
      }

      return async (source, args, context, info, next) => {
        if (params?.featureNames.length) {
          const allowed = await canUserAccessFeatures(
            params.featureNames,
            context.user,
            context.countryCode,
          )

          if (!allowed) {
            throw new GraphQLError(
              `FeatureFlagError: Missing required feature flag for ${parentTypeConfig.name}.${fieldConfig.name}.`,
              {},
            )
          }
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
