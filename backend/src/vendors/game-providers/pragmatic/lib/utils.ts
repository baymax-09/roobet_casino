import type express from 'express'

import { pragmaticLogger } from './logger'
import { getUserFromUserIdWithErrorHandling, errorResponse } from './response'
import {
  displayCurrencyFromRequestCurrency,
  parseCurrencyFromPragId,
  parseUserIdFromPragId,
} from './currencies'
import { SeamlessWalletStatusCodes } from './enums'
import { type TransactionType } from '../documents/transactions'

export function convertBalance(balance: number) {
  return Math.floor(balance * 100) / 100
}

/**
 * @todo validation should happen inside of transaction so that we always respond the same.
 */
export const validateCallbackRequestUser = async (
  transactionType: TransactionType | 'balance',
  req: express.Request,
  res: express.Response,
) => {
  const { userId } = req.body
  const roobetUserId = parseUserIdFromPragId(userId)
  const user = await getUserFromUserIdWithErrorHandling(
    transactionType,
    res,
    roobetUserId,
  )
  if (!user) {
    errorResponse(
      res,
      'User not found',
      SeamlessWalletStatusCodes.PLAYER_NOT_FOUND,
    )
    return { valid: false } as const
  }
  return { valid: true, user } as const
}

/**
 * @todo validation should happen inside of transaction so that we always respond the same.
 */
export const validateCallbackRequestUserAndCurrency = async (
  transactionType: TransactionType,
  req: express.Request,
  res: express.Response,
) => {
  const { userId } = req.body
  const userCurrency = parseCurrencyFromPragId(userId)
  const { user, valid } = await validateCallbackRequestUser(
    transactionType,
    req,
    res,
  )
  if (!valid) {
    return { valid } as const
  }

  const requestCurrency = displayCurrencyFromRequestCurrency(userCurrency)
  if (!requestCurrency) {
    pragmaticLogger('validateCallbackRequestUserAndCurrency', { userId }).error(
      `Pragmatic ${transactionType} invalid currency`,
      {
        body: req.body,
        currency: userCurrency,
      },
    )
    errorResponse(res, 'Invalid currency', SeamlessWalletStatusCodes.BAD_PARAMS)
    return { valid: false } as const
  }
  return { valid: true, requestCurrency, user } as const
}
