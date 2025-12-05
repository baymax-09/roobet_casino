import React from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { useHistory } from 'react-router-dom'

import { useToasts } from 'common/hooks'
import {
  RbacRoleCreateMutation,
  RbacRoleUpdateMutation,
  type RoleQueryResult,
  RolesQuery,
  type RoleCreateMutationResult,
  type RoleUpdateMutationResult,
} from 'admin/gql/rbac'
import { type RbacRole } from 'admin/types/rbac'
import { Loading } from 'mrooi'

import { RoleFormTemplate } from '.'

interface RbacRoleUpdateRouteProps {
  match: {
    params: {
      id: string
    }
  }
}

const INITIAL_VALUES = {
  name: '',
  slug: '',
  policyIds: [],
  userIds: [],
}

export const RolePutRoute: React.FC<RbacRoleUpdateRouteProps> = ({ match }) => {
  const history = useHistory()
  const { toast } = useToasts()

  const { id } = match.params

  const { data, loading } = useQuery<RoleQueryResult>(RolesQuery, {
    variables: { input: { ids: id } },
    onError: error => {
      toast.error(error.message)
    },
    skip: !id,
  })

  const currentRole = data?.roles[0] ?? INITIAL_VALUES

  const [roleCreateMutation] = useMutation<RoleCreateMutationResult>(
    RbacRoleCreateMutation,
    {
      onCompleted: () => {
        toast.success('Successfully created role')
        history.push('/controls/user-roles/role')
      },
      onError: error => {
        toast.error(error.message)
      },
      refetchQueries: [{ query: RolesQuery, variables: { input: {} } }],
    },
  )

  const [roleUpdateMutation] = useMutation<RoleUpdateMutationResult>(
    RbacRoleUpdateMutation,
    {
      onCompleted: () => {
        toast.success('Successfully updated role')
        history.push('/controls/user-roles/role')
      },
      onError: error => {
        toast.error(error.message)
      },
      refetchQueries: [{ query: RolesQuery, variables: { input: {} } }],
    },
  )

  const onSubmit = async (values: RbacRole) => {
    const { id, name, slug, policyIds, userIds } = values

    if (id) {
      return await roleUpdateMutation({
        variables: {
          data: {
            id,
            name,
            slug,
            policyIds,
            userIds,
          },
        },
      })
    }
    return await roleCreateMutation({
      variables: {
        data: {
          name,
          slug,
          policyIds,
          userIds,
        },
      },
    })
  }

  if (loading) {
    return <Loading />
  }

  return (
    <RoleFormTemplate
      title={`${currentRole.id ? 'Update' : 'Create'} Role`}
      initialValues={currentRole}
      onSubmit={onSubmit}
    />
  )
}
