import type express from 'express'

import { type Types as UserTypes } from 'src/modules/user'
import { getUserById } from 'src/modules/user'
import { t } from 'src/util/i18n'

import { pragmaticLogger } from './logger'
import { type ErrorCode, SeamlessWalletStatusCodes } from './enums'
import { getUserFromAuthToken } from './auth'
import { type TransactionType, type Payload } from '../documents/transactions'
import { transactionalProcess } from '../documents/transactions'
import { type ResponsePayloads, type ProcessResult } from './types'

export function successResponse(res: express.Response, result: object): void {
  res.json({ ...result, error: 0, description: 'Success' })
}

export function errorResponse(
  res: express.Response,
  description: string,
  error: ErrorCode,
): void {
  res.json({
    error,
    description,
  })
}

export async function getUserFromUserIdWithErrorHandling(
  transactionType: TransactionType | 'balance',
  res: express.Response,
  assertedUserId: string,
): Promise<UserTypes.User | null> {
  try {
    const user = await getUserById(assertedUserId)
    return user
  } catch (error) {
    pragmaticLogger('getUserFromUserIdWithErrorHandling', {
      userId: assertedUserId,
    }).error(
      `Pragmatic ${transactionType} error getting user from userId`,
      { transactionType },
      error,
    )
    errorResponse(
      res,
      'Player not found.',
      SeamlessWalletStatusCodes.PLAYER_NOT_FOUND,
    )
    return null
  }
}

export async function getUserFromAuthTokenWithErrorHandling(
  transactionType: TransactionType | 'authenticate',
  token: string,
  assertedUserId: string,
  assertUserIdMustMatch: boolean,
): Promise<UserTypes.User | null> {
  try {
    const user = await getUserFromAuthToken(
      token,
      assertedUserId,
      assertUserIdMustMatch,
    )
    return user
  } catch (error) {
    pragmaticLogger('getUserFromAuthTokenWithErrorHandling', {
      userId: assertedUserId,
    }).error(
      `Pragmatic ${transactionType} error getting user from auth token`,
      {},
      error,
    )
    return null
  }
}

/** @todo stop using res from here, separate responsibilities. */
export async function transactionalProcessWithErrorHandling(
  transactionType: TransactionType,
  res: express.Response,
  user: UserTypes.User,
  request: Payload,
  processFunction: () => Promise<ProcessResult<ResponsePayloads>>,
): Promise<void> {
  const logger = pragmaticLogger('transactionalProcessWithErrorHandling', {
    userId: user.id,
  })
  try {
    const response = await transactionalProcess(
      transactionType,
      user,
      request,
      processFunction,
    )

    if (transactionType === 'endRound') {
      // @ts-expect-error need to address this
      delete response.transactionId
    }
    logger.info(`Pragmatic ${transactionType} transactional response`, {
      response,
      request,
    })
    res.json(response)
  } catch (error) {
    logger.error(
      `Pragmatic ${transactionType} transactional process unknown error`,
      { transactionType },
      error,
    )
    errorResponse(
      res,
      t(user, 'error__unknown'),
      SeamlessWalletStatusCodes.INTERNAL_SERVER_ERROR_NO_RECONCILE,
    )
  }
}
