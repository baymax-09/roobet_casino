import { APIValidationError } from 'src/util/errors'
import { type Currency } from 'src/modules/currency/types'
import { assessRisk, RiskStatus } from 'src/modules/fraud/riskAssessment'
import { type User } from 'src/modules/user/types'

import { type DepositType } from '../types'
import { ReasonCodes } from '..'
import { depositLogger } from './logger'

type DepositAction = 'cash_deposit' | 'crypto_deposit'

interface RiskCheckArgs {
  amount: number
  currency: Currency
  depositType: DepositType
  ip: string
  transactionId: string
  session: {
    id: string
    data: string
  }
  user: User
  customFields?: object
}

const ActionMap: Record<DepositType, DepositAction> = {
  bitcoin: 'crypto_deposit',
  ethereum: 'crypto_deposit',
  litecoin: 'crypto_deposit',
  paymentIq: 'cash_deposit',
  tether: 'crypto_deposit',
  usdc: 'crypto_deposit',
  ripple: 'crypto_deposit',
  dogecoin: 'crypto_deposit',
  tron: 'crypto_deposit',
  test: 'cash_deposit',
}

export async function riskCheck(args: RiskCheckArgs) {
  const {
    amount,
    currency,
    depositType,
    transactionId,
    ip,
    session,
    user,
    customFields = {},
  } = args
  const actionType = ActionMap[depositType]

  const transactionPayload = {
    type: depositType,
    amount,
    currency,
    id: transactionId,
  }
  const fraudResponse = await assessRisk({
    user,
    ip,
    actionType,
    session,
    transaction: transactionPayload,
    customFields,
  })
  if (fraudResponse.state === RiskStatus.DECLINED) {
    depositLogger('riskCheck', { userId: user.id }).error(
      `Seon fraud detected for ${user.id}`,
      { fraudResponse },
    )
    // TODO remove api validation error
    if (actionType === 'cash_deposit') {
      throw new APIValidationError('fraud__check_reject')
    } else {
      return {
        statusCode: ReasonCodes.SEON_CHECK.code,
        message: ReasonCodes.SEON_CHECK.message,
      }
    }
  }
}
