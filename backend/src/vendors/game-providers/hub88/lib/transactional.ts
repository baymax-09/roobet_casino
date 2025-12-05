import type express from 'express'

import { type Types as UserTypes } from 'src/modules/user'
import { t } from 'src/util/i18n'

import { apiResponse, errorResponse, type Hub88TransactionResp } from './utils'
import { StatusCodes } from './enums'
import {
  transactionalProcess,
  type TransactionTypeRequest,
} from '../documents/transactions'

export async function transactionalProcessWithErrorHandling<
  T extends 'bet' | 'win' | 'rollback',
>(
  transactionType: T,
  res: express.Response,
  user: UserTypes.User,
  transactionId: string,
  processFunction: () => Promise<Hub88TransactionResp>,
  request: TransactionTypeRequest[T],
) {
  try {
    const response = await transactionalProcess(
      user,
      transactionId,
      processFunction,
      transactionType,
      request,
    )
    await apiResponse(res, response, user)
  } catch (error) {
    await errorResponse(
      res,
      t(user, 'error__unknown'),
      StatusCodes.RS_ERROR_UNKNOWN,
    )
  }
}
