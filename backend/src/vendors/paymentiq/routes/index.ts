import express from 'express'

import { type RouterApp, api } from 'src/util/api'

import {
  type AuthorizeRequest,
  type CancelRequest,
  type TransferRequest,
  type VerifyUserRequest,
} from '../types'
import {
  authorize,
  transfer,
  cancel,
  validateAuthorizationToken,
  generateUnsuccessfulResponse,
  verifyUser,
  formatPIQErrorMessage,
} from '../lib'
import { piqLogger } from '../lib/logger'

const asyncCallback = api.scopedAsyncCallback(piqLogger)

export default function (app: RouterApp) {
  const router = express.Router()
  // Webhook Docs: https://docu-portal-test.paymentiq.io/docs/apis_and_integration/integration_api
  app.use('/paymentiq', router)

  router.post(
    '/verifyuser',
    validateAuthorizationToken,
    asyncCallback(async (req, res, _, logger) => {
      const requestBody: VerifyUserRequest = { ...req.body }

      try {
        const response = await verifyUser(requestBody)

        res.status(200).send(response)
      } catch (error) {
        logger.error('paymentIq verifyUser error', {}, error)

        const errorResponse = formatPIQErrorMessage(error.message)

        res.status(200).send(
          generateUnsuccessfulResponse({
            userId: requestBody.userId,
            externalId: '',
            error: errorResponse,
          }),
        )
      }
    }),
  )

  router.post(
    '/authorize',
    validateAuthorizationToken,
    asyncCallback(async (req, res, _, logger) => {
      const requestBody: AuthorizeRequest = { ...req.body }

      try {
        const response = await authorize(requestBody)

        res.status(200).send(response)
      } catch (error) {
        logger.error('paymentIq authorize error', {}, error)

        const errorResponse = formatPIQErrorMessage(error.message)

        res.status(200).send(
          generateUnsuccessfulResponse({
            userId: requestBody.userId,
            externalId: requestBody.txId,
            error: errorResponse,
          }),
        )
      }
    }),
  )

  router.post(
    '/transfer',
    validateAuthorizationToken,
    asyncCallback(async (req, res, _, logger) => {
      const requestBody: TransferRequest = { ...req.body }

      try {
        const response = await transfer(requestBody)

        res.status(200).send(response)
      } catch (error) {
        logger.error('paymentIq transfer error', {}, error)

        const errorResponse = formatPIQErrorMessage(error.message)

        res.status(200).send(
          generateUnsuccessfulResponse({
            userId: requestBody.userId,
            externalId: requestBody.txId,
            error: errorResponse,
          }),
        )
      }
    }),
  )

  router.post(
    '/cancel',
    validateAuthorizationToken,
    asyncCallback(async (req, res, _, logger) => {
      const requestBody: CancelRequest = { ...req.body }

      try {
        const response = await cancel(requestBody)

        res.status(200).send(response)
      } catch (error) {
        logger.error('paymentIq cancel error', {}, error)

        const errorResponse = formatPIQErrorMessage(error.message)

        res.status(200).send(
          generateUnsuccessfulResponse({
            userId: requestBody.userId,
            externalId: requestBody.txId,
            error: errorResponse,
          }),
        )
      }
    }),
  )
}
