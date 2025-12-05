import gql from 'graphql-tag'

import { type User } from 'common/types'
import { type RbacRole, type RbacPolicy } from 'admin/types/rbac'

const RbacRoleFragment = gql`
  fragment Role on Role {
    id
    name
    slug
    policyIds
    userIds
    policies {
      id
      slug
    }
  }
`
const RbacPolicyFragment = gql`
  fragment Policy on Policy {
    id
    effect
    name
    slug
    rules
  }
`

export const RolesQuery = gql`
  ${RbacRoleFragment}
  query RolesGetAll($input: RolesInputType!) {
    roles(input: $input) {
      ...Role
    }
  }
`

export const PoliciesQuery = gql`
  ${RbacPolicyFragment}
  query PoliciesGetAll($input: PoliciesInputType!) {
    policies(input: $input) {
      ...Policy
    }
  }
`

export const RbacRoleCreateMutation = gql`
  ${RbacRoleFragment}
  mutation RbacRoleCreate($data: RbacRoleCreateInput!) {
    rbacRoleCreate(data: $data) {
      ...Role
    }
  }
`

export const RbacPolicyCreateMutation = gql`
  ${RbacPolicyFragment}
  mutation RbacPolicyCreate($data: RbacPolicyCreateInput!) {
    rbacPolicyCreate(data: $data) {
      ...Policy
    }
  }
`
export const RbacRoleDeleteMutation = gql`
  mutation RbacRoleDelete($data: RbacRoleDeleteInput!) {
    RbacRoleDelete(data: $data) {
      ids
    }
  }
`

export const RbacRoleUpdateMutation = gql`
  ${RbacRoleFragment}
  mutation RbacRoleUpdate($data: RoleUpdateInput!) {
    rbacRoleUpdate(data: $data) {
      ...Role
    }
  }
`

export const RbacPolicyDeleteMutation = gql`
  mutation RbacPolicyDelete($data: PolicyDeleteInput!) {
    RbacPolicyDelete(data: $data) {
      ids
    }
  }
`

export const RbacPolicyUpdateMutation = gql`
  ${RbacPolicyFragment}
  mutation RbacPolicyUpdate($data: PolicyUpdateInput!) {
    rbacPolicyUpdate(data: $data) {
      ...Policy
    }
  }
`

export const UserRolesUpdateMutation = gql`
  mutation UserRolesUpdateMutation($data: UserRolesUpdateInput!) {
    rbacUserRolesUpdate(data: $data) {
      id
    }
  }
`

export interface RoleQueryResult {
  roles: Required<RbacRole>
}

export interface PolicyQueryResult {
  policies: Required<RbacPolicy>
}

export interface RoleCreateMutationResult {
  rbacRoleCreate: Required<RbacRole>
}

export interface PolicyCreateMutationResult {
  rbacPolicyCreate: Required<RbacPolicy>
}

export interface RoleUpdateMutationResult {
  rbacRoleUpdate: Required<RbacRole>
}

export interface UserRolesUpdateMutationResult {
  rbacUserRolesUpdate: Required<Partial<User>>
}

export interface PolicyUpdateMutationResult {
  rbacPolicyUpdate: Required<RbacPolicy>
}

export interface RoleDeleteMutationResult {
  RbacRoleDelete: Required<RbacRole>
}

export interface PolicyDeleteMutationResult {
  RbacPolicyDelete: Required<RbacPolicy>
}
