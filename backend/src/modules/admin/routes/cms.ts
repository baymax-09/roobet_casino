import { Router } from 'express'

import { api } from 'src/util/api'

import { roleCheck } from '../middleware'
import { get, post, patch, _delete } from '../../cms/lib/ops'

export const createCMSRouter = () => {
  const router = Router()

  router.get(
    '/:name/:lang',
    ...roleCheck([{ resource: 'legal', action: 'read' }]),
    api.validatedApiCall(get),
  )

  router.post(
    '/:name/:lang',
    ...roleCheck([{ resource: 'legal', action: 'create' }]),
    api.validatedApiCall(post),
  )

  router.patch(
    '/:name/:lang',
    ...roleCheck([{ resource: 'legal', action: 'update' }]),
    api.validatedApiCall(patch),
  )

  router.delete(
    '/:name/:lang',
    ...roleCheck([{ resource: 'legal', action: 'delete' }]),
    api.validatedApiCall(_delete),
  )

  return router
}
