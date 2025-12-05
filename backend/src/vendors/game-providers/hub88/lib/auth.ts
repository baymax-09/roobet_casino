import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { type RequestHandler } from 'express'
import type express from 'express'

import { config } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import { decodeToken } from 'src/modules/auth'

import { errorResponse } from './utils'
import { StatusCodes } from './enums'
import { hub88Logger } from './logger'

const DIGEST_TYPE = 'RSA-SHA256'

/**
 * apiPublicKey is Hub88's public key
 * privateKey is our private key
 */
const { privateKey, apiPublicKey } = config.hub88

export function generateAuthToken(user: UserTypes.User): string {
  const token = jwt.sign({ id: user.id, service: 'hub88' }, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: '48 hours',
  })
  return token
}

/**
 * We needed custom tokens of a fixed length so the payload just decodes directly to userId
 */
async function getUserFromAuthToken(
  token: string,
): Promise<UserTypes.User | null> {
  const { user } = await decodeToken(token, 'hub88')
  return user
}

export function validatePayloadSignature(
  payload: any,
  signature: string,
): boolean {
  const message = JSON.stringify(payload)
  return crypto
    .createVerify(DIGEST_TYPE)
    .update(message)
    .verify(apiPublicKey, signature, 'base64')
}

export function generateSignatureForPayload(payload: any): string {
  const message = JSON.stringify(payload)
  return crypto
    .createSign(DIGEST_TYPE)
    .update(message)
    .sign(privateKey, 'base64')
}

export const authMiddleware: RequestHandler = (req, res, next) => {
  const logger = hub88Logger('authMiddleware', { userId: null })
  const signature = req.headers['x-hub88-signature'] || ''
  if (
    typeof signature !== 'string' ||
    !validatePayloadSignature(req.body, signature)
  ) {
    logger.error('validatePayloadSignature mismatch', {
      body: req.body,
      signature,
    })
    errorResponse(
      res,
      'Invalid signature',
      StatusCodes.RS_ERROR_INVALID_SIGNATURE,
    ).catch(err => {
      logger.error('error response failed', {}, err)
    })
    return
  }

  next()
}

export async function getUserFromAuthTokenWithErrorHandling(
  path: string,
  res: express.Response,
  userId: string,
  token: string,
) {
  try {
    const user = await getUserFromAuthToken(token)
    return user
  } catch (error) {
    if (error.toString().includes('Invalid token')) {
      await errorResponse(
        res,
        'Invalid token.',
        StatusCodes.RS_ERROR_INVALID_TOKEN,
      )
      return
    } else if (error.toString().includes('Asserted user does not match')) {
      await errorResponse(
        res,
        'Asserted user does not match.',
        StatusCodes.RS_ERROR_INVALID_TOKEN,
      )
      return
    } else if (error.toString().includes('No user')) {
      await errorResponse(
        res,
        'User not found.',
        StatusCodes.RS_ERROR_INVALID_TOKEN,
      )
      return
    }
    return null
  }
}
