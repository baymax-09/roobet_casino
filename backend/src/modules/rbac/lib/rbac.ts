import { scopedLogger } from 'src/system/logger'
import { type RBACRequests, type RBACRule } from '../types'
import { type User } from 'src/modules/user/types/User'

import { availableRules } from './availableRules'
import {
  resolveAllRoles,
  resolveAllowedRulesFromRoleSlugs,
  isPermitted,
} from './resolve'

interface RoleAccessRequestInput {
  requests: RBACRequests
  user?: RBACUser
}

export interface AvailableRole {
  role: string
  rules: RBACRule[]
}

export interface AvailableRule {
  rule: string
}

type RBACUser = Pick<
  User,
  'id' | 'roles' | 'staff' | 'email' | 'emailVerified' | 'twofactorEnabled'
>
type ValidatedRBACUserResponse =
  | {
      success: true
      message?: string
    }
  | {
      success: false
      message: string
    }

const rbacLogger = scopedLogger('rbac')

export const validateRBACUser = (user: RBACUser): ValidatedRBACUserResponse => {
  let success = true
  const errors = []
  if (!user.staff) {
    errors.push('User is not a staff member.')
    success = false
  }
  if (!user.email || !user.email.includes('@roobet.com')) {
    errors.push('User email is not a roobet.com email.')
    success = false
  }
  if (!user.emailVerified) {
    errors.push('User email is not verified.')
    success = false
  }
  if (!user.twofactorEnabled) {
    errors.push('User does not have 2FA enabled.')
    success = false
  }
  return {
    success,
    message: errors.join(' '),
  }
}

export const getUserAccessRules = async ({
  user,
}: {
  user: RBACUser
}): Promise<string[]> => {
  const validateRBACUserResponse = validateRBACUser(user)
  if (!validateRBACUserResponse.success) {
    // Return an empty array if the user is not a valid RBAC user.
    return []
  }

  const permittedRules = await resolveAllowedRulesFromRoleSlugs(
    user.roles ?? [],
  )
  // TODO delete shortly
  rbacLogger('getUserAccessRules', { userId: user.id }).info('permittedRules', {
    permittedRules: JSON.stringify(permittedRules),
  })

  return permittedRules
}

export const getAvailableRoles = async (): Promise<AvailableRole[]> => {
  const availableRoles = await resolveAllRoles()

  // TODO delete shortly
  rbacLogger('getAvailableRoles', { userId: null }).info('availableRoles', {
    availableRoles: JSON.stringify(availableRoles),
  })

  return availableRoles
}

export const getAvailableRules = async (): Promise<AvailableRule[]> => {
  return availableRules
}

export const isRoleAccessPermitted = async ({
  user,
  requests,
}: RoleAccessRequestInput): Promise<boolean> => {
  // Return false if the user is not provided.
  if (!user) {
    return false
  }

  // Return false if the user is not a valid RBAC user.
  const validateRBACUserResponse = validateRBACUser(user)
  if (!validateRBACUserResponse.success) {
    return false
  }

  const permit = await isPermitted(user.roles ?? [], requests)

  // TODO delete shortly
  rbacLogger('isRoleAccessPermitted', { userId: user.id }).info('', {
    permit,
    requests,
  })

  return permit
}
