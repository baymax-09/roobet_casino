import type express from 'express'

import { t } from 'src/util/i18n'
import { type Types as UserTypes } from 'src/modules/user'
import { getBalanceFromUserAndType } from 'src/modules/user/balance'

import { StatusCodes } from './enums'
import {
  type WinRequest,
  type BetRequest,
  type RollbackRequest,
} from './transactions'
import { hub88DemoCurrency } from './currencies'
import { hub88Logger } from './logger'

export interface Result {
  user: string
  currency?: string
  balance?: number
  status?: string
  registration_date?: string
}

export function makeSuccessResponse(
  request: WinRequest | BetRequest | RollbackRequest,
  transactionType: 'win' | 'bet' | 'rollback',
  result: Result,
) {
  return { success: true, result, transactionType, request } as const
}

export function makeErrorResponse(message: string, code: string) {
  return { success: false, error: { message, code } } as const
}

export type Hub88TransactionResp =
  | ReturnType<typeof makeErrorResponse>
  | ReturnType<typeof makeSuccessResponse>

export async function apiResponse(
  res: express.Response,
  response: Hub88TransactionResp,
  user: UserTypes.User,
) {
  if (response.success) {
    successResponse(res, response.result)
  } else if (response.error) {
    await errorResponse(res, response.error.message, response.error.code, user)
  } else {
    await errorResponse(
      res,
      t(user, 'error__unknown'),
      StatusCodes.RS_ERROR_UNKNOWN,
      user,
    )
  }
}

export function successResponse(res: express.Response, result: Result): void {
  const newResult = {
    ...result,
    status: StatusCodes.RS_OK,
    request_uuid: res.req.body.request_uuid,
  }
  res.json(newResult)
}

export async function errorResponse(
  res: express.Response,
  message: string,
  code: string,
  user: UserTypes.User | null = null,
): Promise<void> {
  const logger = hub88Logger('errorResponse', { userId: user?.id ?? null })
  if (user) {
    const balanceReturn = await getBalanceFromUserAndType({
      user,
      balanceType: user.selectedBalanceType || 'crypto',
    })
    const balance = user
      ? convertBalanceToAmount(balanceReturn.balance)
      : undefined

    logger.info('errorResponse', { message, code, body: res.req.body, balance })
    res.json({
      status: code,
      request_uuid: res.req.body.request_uuid,
      balance,
    })
  } else {
    logger.info('errorResponse', { message, code, body: res.req.body })
    res.json({
      status: code,
      request_uuid: res.req.body.request_uuid,
    })
  }
}

export const convertBalanceToAmount = (balance: number) => {
  return Math.round((balance || 0) * 100000)
}

export const convertAmountToBalance = (amount: number) => {
  return (amount || 0) / 100000
}

export const isDemoMode = (currency: unknown) => {
  if (typeof currency !== 'string') {
    return false
  }
  return currency === hub88DemoCurrency
}
