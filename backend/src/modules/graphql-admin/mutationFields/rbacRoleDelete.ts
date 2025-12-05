import { GraphQLError } from 'graphql'
import { mutationField, nonNull, inputObjectType, objectType } from 'nexus'
import { deleteRoles, getRole } from 'src/modules/rbac/documents/RBACRoles'

const RoleDeleteInput = inputObjectType({
  name: 'RbacRoleDeleteInput',
  definition(type) {
    type.nonNull.list.nonNull.nonEmptyString('ids', {
      auth: null,
      description: 'The id of the roles you are trying to delete.',
    })
  },
})

const DeleteRoleResponse = objectType({
  name: 'DeleteRoleResponse',
  definition(type) {
    type.nonNull.list.nonNull.nonEmptyString('ids')
  },
})

export const RoleDeleteMutationField = mutationField('RbacRoleDelete', {
  description: 'Delete Roles.',
  type: nonNull(DeleteRoleResponse),
  args: { data: nonNull(RoleDeleteInput) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'user_roles', action: 'delete' }],
  },
  resolve: async (_, { data }) => {
    const { ids } = data

    for (const roleId of ids) {
      const role = await getRole(roleId)
      if (!role) {
        throw new GraphQLError(`role ID(${roleId}) does not exist.`)
      }
    }
    await deleteRoles(ids)
    return { ids }
  },
})
