import express from 'express'

import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { logAdminAction, roleCheck } from 'src/modules/admin/middleware'

import { updateCRMForUserId, updateCRMIfNotExist } from '../documents/crm'
import { handleAffiliateUpdate } from '../lib'
import { createAuditRecord } from 'src/modules/audit'
import { APIValidationError } from 'src/util/errors'
import { getUserById } from 'src/modules/user'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/crm', router)

  router.post(
    '/setUTMVariables',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { utm_source, utm_medium, utm_campaign } = req.body
      if (utm_source || utm_campaign || utm_campaign) {
        await updateCRMIfNotExist(user.id, {
          utm_source,
          utm_medium,
          utm_campaign,
        })
      }
    }),
  )

  router.post(
    '/ref',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { cxd, cxAffId, affiliateName } = req.body
      await handleAffiliateUpdate(user, { cxd, cxAffId, affiliateName })
    }),
  )

  router.post(
    '/toggleInfluencer',
    api.check,
    ...roleCheck([{ resource: 'crm', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, isInfluencer } = req.body
      const auditData = {
        editorId: adminUser.id,
        subjectId: `${userId}`,
        notes: `${isInfluencer}`,
        databaseAction: 'edit',
        actionType: 'influencerChange',
      } as const

      return await createAuditRecord(auditData, async () => {
        await updateCRMForUserId(userId, {
          marketing_influencer: isInfluencer,
        })
      })
    }),
  )

  router.post(
    '/setSelfCxAffId',
    api.check,
    ...roleCheck([{ resource: 'crm', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const userId = req.body.userId

      if (typeof userId !== 'string') {
        throw new APIValidationError("Missing required param 'userId'")
      }

      const affiliate = await getUserById(userId)

      if (!affiliate) {
        throw new APIValidationError('Failed to find specified affiliate.')
      }

      const selfCxAffId: string | null = (() => {
        if (typeof req.body.cxAffId !== 'string') {
          throw new APIValidationError('Affiliate ID must be a string')
        }

        return req.body.cxAffId
      })()

      const result = await updateCRMForUserId(affiliate.id, {
        selfCxAffId,
      })

      return result
    }),
  )

  router.post(
    '/setCxAffId',
    api.check,
    ...roleCheck([{ resource: 'crm', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId, refCxAffId } = req.body
      const { user } = req as RoobetReq

      if (typeof userId !== 'string') {
        throw new APIValidationError("Missing required param 'userId'")
      }

      const affiliate = await getUserById(userId)

      if (!affiliate) {
        throw new APIValidationError('Failed to find specified affiliate.')
      }

      if (typeof refCxAffId !== 'string') {
        throw new APIValidationError('Cx Affiliate ID must be a string')
      }

      const auditData = {
        editorId: user.id,
        subjectId: `${userId}`,
        notes: `${refCxAffId}`,
        databaseAction: 'edit',
        actionType: 'cellxpertChange',
      } as const

      const result = await createAuditRecord(
        auditData,
        async () =>
          await updateCRMForUserId(affiliate.id, { cxAffId: refCxAffId }),
      )

      return result
    }),
  )

  router.post(
    '/setCxd',
    api.check,
    ...roleCheck([{ resource: 'crm', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId, refCxd } = req.body
      const { user } = req as RoobetReq

      if (typeof userId !== 'string') {
        throw new APIValidationError("Missing required param 'userId'")
      }

      const affiliate = await getUserById(userId)

      if (!affiliate) {
        throw new APIValidationError('Failed to find specified affiliate.')
      }
      if (typeof refCxd !== 'string') {
        throw new APIValidationError('CXD must be a string')
      }

      const auditData = {
        editorId: user.id,
        subjectId: `${userId}`,
        notes: `${refCxd}`,
        databaseAction: 'edit',
        actionType: 'cellxpertChange',
      } as const

      const result = await createAuditRecord(auditData, () => {
        updateCRMForUserId(affiliate.id, { cxd: refCxd })
      })

      return result
    }),
  )
}
