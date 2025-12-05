import { GraphQLError } from 'graphql'
import {
  plugin,
  printedGenTyping,
  printedGenTypingImport,
} from 'nexus/dist/core'

import {
  isRoleAccessPermitted,
  validateRBACUser,
  type RBACRequests,
} from 'src/modules/rbac'

import { typeImportPath } from '../lib/plugins'
import { scopedLogger } from 'src/system/logger'

/**
 * Auth parameters shape. The auth config is required
 * for all fields. Null is acceptable for fields with a parent
 * other than Query and Mutation.
 */
export type AuthParams = null | {
  /**
   * Whether or not the query/muation requires authentication.
   */
  authenticated?: boolean

  /**
   * List of the access rules being authenticated against.
   */
  accessRules?: RBACRequests
}

/**
 * Insert import statement inside generated nexus file.
 */
const AuthPluginImport = printedGenTypingImport({
  module: typeImportPath('auth'),
  bindings: ['AuthParams'],
})

/**
 * Add `auth` property to field definitions.
 */
const fieldDefTypes = printedGenTyping({
  optional: false,
  name: 'auth',
  description: 'Authentication/authorization config for field.',
  type: 'AuthParams',
  imports: [AuthPluginImport],
})

export const authPlugin = () =>
  plugin({
    name: 'AuthPlugin',
    description: 'Validates authentication and authorization.',
    fieldDefTypes,
    onCreateFieldResolver: config => {
      const { fieldConfig, parentTypeConfig } = config

      // Get `validate` property from field definition.
      const params: AuthParams | undefined =
        fieldConfig.extensions?.nexus?.config?.auth

      const isQueryOrMutation = ['Query', 'Mutation'].includes(
        config.parentTypeConfig.name,
      )

      if (isQueryOrMutation && !params) {
        scopedLogger('util/graphql')('authPlugin', { userId: null }).error(
          'GraphQL schema failed to build. Queries and Mutation must specify an auth config.',
          {
            fieldName: fieldConfig.name,
            parentTypeName: parentTypeConfig.name,
          },
        )

        throw new GraphQLError(
          'Top level fields must specify an auth config.',
          {},
        )
      }

      if (!params) {
        return undefined
      }

      return async (source, args, context, info, next) => {
        // Verify user is authenticated, aka exists in context.
        if (params.authenticated && !context.user) {
          throw new GraphQLError('Unauthenticated.', {})
        }

        // Verify the user has access to this based on the given resources and actions provided
        if (params.accessRules?.length) {
          const validRBACUserResponse = validateRBACUser(context.user)
          if (!validRBACUserResponse.success) {
            throw new GraphQLError(
              `AuthError: User is not a valid RBAC user for ${parentTypeConfig.name}.${fieldConfig.name}. ${validRBACUserResponse.message}`,
              {},
            )
          }
          const isAccessPermitted = await isRoleAccessPermitted({
            user: context.user,
            requests: params.accessRules,
          })
          if (!isAccessPermitted) {
            throw new GraphQLError(
              `AuthError: Missing role permissions to access ${parentTypeConfig.name}.${fieldConfig.name}.`,
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
