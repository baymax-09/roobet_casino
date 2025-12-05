import { type AuthorizeRequest } from '../types'
import { errorMap } from '../constants'
import { generateUnsuccessfulResponse, parsePaymentMethod } from './util'
import { startCashDeposit, startCashWithdrawal } from './'

export const authorize = async (requestBody: AuthorizeRequest) => {
  const transactionType = parsePaymentMethod(requestBody.txName)

  if (transactionType === 'deposit') {
    return await startCashDeposit(requestBody)
  }

  if (transactionType === 'withdrawal') {
    return await startCashWithdrawal(requestBody)
  }

  return generateUnsuccessfulResponse({
    userId: requestBody.userId,
    externalId: requestBody.txId,
    error: errorMap.UNEXPECTED_TRANSACTION_TYPE,
  })
}
