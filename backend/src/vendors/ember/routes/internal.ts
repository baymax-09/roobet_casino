import express, { type Router } from 'express'

import { type RoobetReq, api } from 'src/util/api'

import { createEmberAccount, deleteEmberAccountLink } from '../documents'
import { verifyEmberLinkMiddleware } from '../middleware'
import { confirmEmberAccountLink, emberLogger } from '../lib'
import { APIValidationError } from 'src/util/errors'

export const createEmberInternalRouter = (app: Router) => {
  const router = express.Router()
  app.use('/', router)

  router.post(
    '/linkAccount',
    verifyEmberLinkMiddleware,
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const logger = emberLogger('linkAccount', { userId: user.id })
      if (!req.context || !req.context.emberUserId) {
        logger.error('Invalid emberUserId in request context')
        return {
          success: false,
          detail: 'Invalid emberUserId in request context',
        }
      }
      const { emberUserId } = req.context

      try {
        const linkedAccount = await createEmberAccount(user.id, emberUserId)
        if (linkedAccount.success) {
          const confirmLinkResponse = await confirmEmberAccountLink({
            userId: user.id,
            emberUserId,
          })
          if (!confirmLinkResponse.success) {
            logger.debug('Failed to confirm link', {
              detail: confirmLinkResponse,
            })
            throw new APIValidationError(confirmLinkResponse.detail)
          }
          return { success: true, detail: 'Account linked successfully' }
        } else {
          return { success: false, detail: linkedAccount.detail }
        }
      } catch (error) {
        await deleteEmberAccountLink(user.id, emberUserId)
        if (error.message === 'User already linked to another account') {
          return {
            success: false,
            detail: 'User already linked to another account',
          }
        }
        logger.error('Unexpected/Unimportant error caught', {
          detail: error.message,
        })
        return { success: false, detail: 'Account link failed' }
      }
    }),
  )
}
