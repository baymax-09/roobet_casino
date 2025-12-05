import { Router } from 'express'

import { getAvailableRoles, getAvailableRules } from 'src/modules/rbac'
import { api } from 'src/util/api'

import { roleCheck } from '../middleware'

export function createRolesRouter() {
  const router = Router()

  router.get(
    '/getAvailableUserRoles',
    ...roleCheck([{ resource: 'user_roles', action: 'update' }]),
    api.validatedApiCall(async () => {
      return { availableRoles: await getAvailableRoles() }
    }),
  )

  router.get(
    '/getAvailableRules',
    ...roleCheck([{ resource: 'user_roles', action: 'update' }]),
    api.validatedApiCall(async () => {
      return { availableRules: await getAvailableRules() }
    }),
  )

  return router
}
