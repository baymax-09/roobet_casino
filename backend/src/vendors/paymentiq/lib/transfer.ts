import { type TransferRequest } from '../types'
import { completeCashDeposit } from './cashDeposit'
import { completeCashWithdrawal } from './cashWithdrawal'
import { errorMap } from '../constants'
import { generateUnsuccessfulResponse, parsePaymentMethod } from './util'

export const transfer = async (requestBody: TransferRequest) => {
  const transactionType = parsePaymentMethod(requestBody.txName)

  if (transactionType === 'deposit') {
    return await completeCashDeposit(requestBody)
  }

  if (transactionType === 'withdrawal') {
    return await completeCashWithdrawal(requestBody)
  }

  return generateUnsuccessfulResponse({
    userId: requestBody.userId,
    externalId: requestBody.txId,
    error: errorMap.UNEXPECTED_TRANSACTION_TYPE,
  })
}
