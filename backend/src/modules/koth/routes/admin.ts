import { Router } from 'express'
import { type UpdatePayload } from 'mongoose'
import { logAdminAction, roleCheck } from 'src/modules/admin/middleware'
import { api } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { getKOTHById, type CreateKOTHRequest } from '../documents/koths'
import { createKOTH, getAllKOTHs, updateKothById } from '../documents/koths'

export function createAdminKOTHRouter() {
  const router = Router()

  router.get(
    '/',
    api.check,
    ...roleCheck([{ resource: 'koth', action: 'read' }]),
    logAdminAction,
    api.validatedApiCall(async () => {
      return await getAllKOTHs()
    }),
  )

  router.get(
    '/:id',
    api.check,
    ...roleCheck([{ resource: 'koth', action: 'read' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { id } = req.params
      if (typeof id !== 'string') {
        throw new APIValidationError('api__missing_param', ['KOTH id'])
      }
      return await getKOTHById(id)
    }),
  )

  router.post(
    '/',
    api.check,
    ...roleCheck([{ resource: 'koth', action: 'create' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const createRequest: CreateKOTHRequest = {
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
        whichRoo: req.body.whichRoo,
        minBet: req.body.minBet,
      }

      if (createRequest.minBet < 1 && createRequest.whichRoo === 'king') {
        throw new APIValidationError('api__invalid_param', [
          'Min bet must be equal to or greater than 1',
        ])
      }

      if (!['astro', 'king'].includes(createRequest.whichRoo)) {
        throw new APIValidationError('api__invalid_param', ['whichRoo'])
      }

      return await createKOTH(createRequest)
    }),
  )

  router.patch(
    '/:id',
    api.check,
    ...roleCheck([{ resource: 'koth', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { id } = req.params

      if (typeof id !== 'string') {
        throw new APIValidationError('api__missing_param', ['KOTH id'])
      }

      const payload: UpdatePayload<CreateKOTHRequest> = {
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
        whichRoo: req.body.whichRoo,
        minBet: req.body.whichRoo === 'astro' ? 0 : req.body.minBet,
      }

      if (payload.minBet < 1 && payload.whichRoo === 'king') {
        throw new APIValidationError('api__invalid_param', [
          'Min bet must be equal to or greater than 1',
        ])
      }

      if (!['astro', 'king'].includes(payload.whichRoo)) {
        throw new APIValidationError('api__invalid_param', ['whichRoo'])
      }

      return await updateKothById(id, payload)
    }),
  )
  return router
}
