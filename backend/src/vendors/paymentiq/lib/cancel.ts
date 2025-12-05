import { type CancelRequest } from '../types'
import { cancelCashDeposit } from './cashDeposit'
import { cancelCashWithdrawal } from './cashWithdrawal'
import { errorMap } from '../constants'
import { generateUnsuccessfulResponse, parsePaymentMethod } from './util'

export const cancel = async (requestBody: CancelRequest) => {
  const transactionType = parsePaymentMethod(requestBody.txName)

  if (transactionType === 'deposit') {
    return await cancelCashDeposit(requestBody)
  }

  if (transactionType === 'withdrawal') {
    return await cancelCashWithdrawal(requestBody)
  }

  return generateUnsuccessfulResponse({
    userId: requestBody.userId,
    externalId: requestBody.txId,
    error: errorMap.UNEXPECTED_TRANSACTION_TYPE,
  })
}
