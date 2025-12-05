import urlencode from 'urlencode'
import sha1 from 'sha1'
import md5 from 'md5'
import _ from 'underscore'
import { type RequestHandler } from 'express'

import { config } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import { getUserById } from 'src/modules/user'

import { pragmaticLogger } from './logger'
import { SeamlessWalletStatusCodes } from './enums'
import { errorResponse } from './response'

export function calculateAuthHash(params: object): string {
  /*
   * 1. Sort all parameter by keys in alphabetical order.
   * 2. Append them (if the value is not null or empty) in key1=value1&key2=value2.
   * 3. Append secret key, e.g.: key1=value1&key2=value2SECRET.
   * 4. Calculate the hash by using MD5.
   * 5. Compare with hash parameter. In the case of failure Casino Operator should send the error code 5.
   */
  const sortedParams = _.sortBy(Object.entries(params), ([key]) => key)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  const sortedParamsWithSecretKey = `${sortedParams}${config.pragmatic.secretKey}`
  const paramsMd5 = md5(sortedParamsWithSecretKey)

  return paramsMd5
}

export const verifyRequestHashMiddleware: RequestHandler = (req, res, next) => {
  const params = req.body
  const { hash } = params
  delete params.hash
  const calculatedHash = calculateAuthHash(params)
  if (calculatedHash !== hash) {
    pragmaticLogger('verifyRequestHashMiddleware', { userId: null }).info(
      'generated hash does not match request hash',
      hash,
    )
    errorResponse(
      res,
      'game__invalid_hash',
      SeamlessWalletStatusCodes.INVALID_HASH,
    )
  } else {
    next()
  }
}

export function generateAuthToken(user: UserTypes.User): string {
  const hash = sha1(`${user.id}:${config.jwt.secret}`)
  const token = urlencode(`${user.id}:${hash}`)
  return token
}

/**
 * We needed custom tokens of a fixed length so the payload just decodes directly to userId
 */
export async function getUserFromAuthToken(
  token: string,
  assertedUserId: string,
  assertedUserIdMustMatch = true,
): Promise<UserTypes.User> {
  const [userId, hash] = urlencode.decode(token).split(':')
  const logger = pragmaticLogger('getUserFromAuthToken', { userId })
  const testHash = sha1(`${userId}:${config.jwt.secret}`)
  if (hash !== testHash) {
    logger.info('getUserFromAuthToken invalid hash', {
      hash,
      testHash,
      token,
      assertedUserId,
      assertedUserIdMustMatch,
    })
    throw new Error('Invalid hash')
  }

  if (assertedUserIdMustMatch && assertedUserId !== userId) {
    logger.info('does not match token', { assertedUserId })
    throw new Error('Asserted user does not match token')
  }

  const user = await getUserById(userId)
  if (!user) {
    throw new Error('No user')
  }

  return user
}
