import express from 'express'

import { createAuditRecord } from 'src/modules/audit'
import { type Audit } from 'src/modules/audit/documents/audit'
import { KYC, getKycForUser } from 'src/modules/fraud/kyc'
import { getUserById, getUserNameById } from 'src/modules/user'
import { UserArchive } from 'src/modules/user/documents'
import * as UserDocument from 'src/modules/user/documents/documents'
import {
  approveDocumentByKey,
  rejectDocumentByKey,
  getDocumentByKey,
  getDocumentCounts,
  getDocuments,
  updateDocumentByKey,
} from 'src/modules/user/documents/documents'
import { media } from 'src/util/media'
import { api, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { uploadUserFile } from 'src/modules/user/lib/uploadUserFile'
import {
  checkKycDeterministicSystemEnabled,
  getKYCTransactionSystems,
  type TogglableSystemName,
} from 'src/modules/userSettings'
import { UserIdT } from 'src/util/types/userId'

import { logAdminAction, roleCheck } from '../middleware'

export const createKycRouter = () => {
  const router = express.Router()

  router.get(
    '/pending',
    ...roleCheck([{ resource: 'kyc', action: 'read' }]),
    api.validatedApiCall(async req => {
      const { query } = req as unknown as RoobetReq

      // Do not change these to ??.
      const limit = Number(query.limit) || 25
      const skip = Number(query.skip) || 0

      // Parse sort from complex query type, only allow updatedAt.
      const sort: { updatedAt: 1 | -1 } = (() => {
        if (typeof query.sort === 'object' && 'updatedAt' in query.sort) {
          return {
            updatedAt: query.sort.updatedAt === '1' ? 1 : -1,
          }
        }

        return { updatedAt: -1 }
      })()

      const result = await UserDocument.getUserGroupedPendingDocuments(
        limit,
        skip,
        sort,
      )

      const sample = await Promise.all(
        result.sample.map(async document => {
          const user = await getUserById(document.userId)

          if (!user) {
            return {
              user: {
                id: document.userId,
                name: 'Deleted User',
              },
              document,
              kyc: null,
            }
          }

          return {
            user,
            document,
            kyc: await getKycForUser(user),
          }
        }),
      )

      return {
        sample,
        total: result.total,
      }
    }),
  )

  router.get(
    '/getKYCStats',
    ...roleCheck([{ resource: 'kyc', action: 'read' }]),
    api.validatedApiCall(async () => {
      return await getDocumentCounts()
    }),
  )

  router.get(
    '/getKYCForUserId',
    ...roleCheck([{ resource: 'kyc', action: 'read' }]),
    api.validatedApiCall(async req => {
      let { userId } = req.query

      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('api__missing_param', ['userId'])
      }

      let user =
        (await getUserById(userId)) ||
        (await UserArchive.getArchivedUserByRethinkId(userId))

      if (!user) {
        // attempt to lookup user from the userDocument
        const doc = await UserDocument.getDocumentById(userId)

        if (doc) {
          user =
            (await getUserById(doc.userId)) ||
            (await UserArchive.getArchivedUserByRethinkId(userId))
          userId = user?.id
        }
      }

      if (!user) {
        throw new APIValidationError('User with this userId does not exist.')
      }

      const docsUserUploaded = await getDocuments({ userId })

      // Load reviewer names.
      const documents = await Promise.all(
        docsUserUploaded.map(async doc => {
          if (!doc.reviewedBy) {
            return doc
          }

          const reviewer = await getUserNameById(doc.reviewedBy)

          return {
            ...doc,
            reviewer,
          }
        }),
      )

      const kycDocument = await KYC.getForUser(user)

      delete kycDocument.kyc

      return {
        user,
        documents,
        kyc: kycDocument,
      }
    }),
  )

  router.get(
    '/getUserDocumentByKey',
    ...roleCheck([{ resource: 'kyc', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const filename = req.query.key

      if (typeof filename !== 'string') {
        res
          .status(400)
          .send({ success: false, err: 'Valid Filename was not specified.' })
        return
      }

      const buffer = await media.download({
        dest: 'verification',
        path: filename,
      })

      if (!buffer) {
        res
          .status(400)
          .send({ success: false, err: 'Could not find or read file.' })
        return
      }

      // Specify attachment filename on response.
      res.attachment(filename.replace(/^.*[\\/]/, ''))

      res.send(buffer)
    }),
  )

  router.post(
    '/deleteUserDocumentByKey',
    ...roleCheck([{ resource: 'kyc', action: 'delete' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user } = req as unknown as RoobetReq

      if (!user) {
        throw new APIValidationError('api__missing_param', ['user'])
      }

      const doc = await getDocumentByKey(req.body.key)

      if (!doc) {
        throw new APIValidationError('Document not found')
      }

      const auditRecordData: Audit = {
        editorId: user.id,
        subjectId: doc.userId,
        databaseAction: 'delete',
        actionType: 'kycDocDeletion',
        notes: JSON.stringify({ key: doc.key }),
        success: true,
      }

      await createAuditRecord(auditRecordData, async () => {
        await rejectDocumentByKey(req.body.key, true, true, user.id)
      })
    }),
  )

  router.post(
    '/rejectUserDocumentByKey',
    ...roleCheck([{ resource: 'kyc', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user } = req as unknown as RoobetReq

      if (!user) {
        throw new APIValidationError('api__missing_param', ['user'])
      }

      const doc = await getDocumentByKey(req.body.key)

      if (!doc) {
        throw new APIValidationError('Document not found')
      }

      const auditRecordData: Audit = {
        editorId: user.id,
        subjectId: doc.userId,
        databaseAction: 'edit',
        actionType: 'kycDocRejection',
        notes: JSON.stringify({ key: doc.key }),
        success: true,
      }

      await createAuditRecord(auditRecordData, async () => {
        await rejectDocumentByKey(req.body.key, false, true, user.id)
      })
    }),
  )

  router.post(
    '/approveUserDocumentByKey',
    ...roleCheck([{ resource: 'kyc', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user, body } = req as unknown as RoobetReq

      if (!user) {
        throw new APIValidationError('api__missing_param', ['user'])
      }

      const { key } = body

      if (!key || typeof key !== 'string') {
        throw new APIValidationError('api__invalid_param', ['key'])
      }

      const doc = await getDocumentByKey(req.body.key)

      if (!doc) {
        throw new APIValidationError('Document not found')
      }

      const auditRecordData: Audit = {
        editorId: user.id,
        subjectId: doc.userId,
        databaseAction: 'edit',
        actionType: 'kycDocApproval',
        notes: JSON.stringify({ key: doc.key }),
        success: true,
      }

      await createAuditRecord(auditRecordData, async () => {
        await approveDocumentByKey(key, { reviewedBy: user.id })
      })
    }),
  )

  router.post(
    '/updateUserDocumentStatus',
    ...roleCheck([{ resource: 'kyc', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user, body } = req as unknown as RoobetReq

      if (!user) {
        throw new APIValidationError('api__missing_param', ['user'])
      }

      const { key, status } = body

      if (!key || typeof key !== 'string') {
        throw new APIValidationError('api__invalid_param', ['key'])
      }
      if (!status || !UserDocument.isDocumentStatusType(status)) {
        throw new APIValidationError('api__invalid_param', ['status'])
      }

      const doc = await getDocumentByKey(req.body.key)

      if (!doc) {
        throw new APIValidationError('Document not found')
      }

      if (status === 'approved') {
        await approveDocumentByKey(key, { reviewedBy: user.id })
      } else if (status === 'rejected') {
        // Should we be deleting instead of just rejecting?
        await rejectDocumentByKey(req.body.key, false, true, user.id)
      } else {
        await updateDocumentByKey(key, { status })
      }
    }),
  )

  router.post(
    '/staffUploadDocument',
    ...roleCheck([{ resource: 'kyc', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { documentType, userId, hashedFileName } = req.body

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('User with this userId does not exist.')
      }

      if (!hashedFileName || typeof hashedFileName !== 'string') {
        throw new APIValidationError('Invalid file name supplied.')
      }

      await uploadUserFile({ user, documentType, hashedFileName })

      return { success: true }
    }),
  )

  router.get(
    '/transactionSystems',
    ...roleCheck([{ resource: 'kyc', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const { userId } = req.query

      if (!UserIdT.is(userId)) {
        throw new APIValidationError('api__invalid_param', ['userId'])
      }

      const user = await getUserById(userId)

      const kycTransactionSystems = await getKYCTransactionSystems(userId)

      for (const systemName in kycTransactionSystems) {
        const requiredKYCLevel = await checkKycDeterministicSystemEnabled(
          user!,
          systemName as TogglableSystemName,
        )
        if (typeof requiredKYCLevel === 'number') {
          // @ts-expect-error all kyc systems will have the "enabled" property
          kycTransactionSystems[systemName].enabled = false
        }
      }

      res.send({ kycTransactionSystems })
    }),
  )

  return router
}
