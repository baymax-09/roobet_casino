import { type User } from 'src/modules/user/types'

import { createWithdrawal } from '../documents/withdrawals_mongo'
import { type WithdrawalRequest } from '../types'

export async function createWithdraw(
  user: User,
  request: WithdrawalRequest,
): Promise<string> {
  const result = await createWithdrawal(user, request)
  return result.id
}

export async function buildWithdrawal(
  request: any,
): Promise<WithdrawalRequest> {
  return {
    ...request,
    amount: parseFloat(request.amount.toString()),
    totalValue: parseFloat(request.amount.toString()),
  }
}
