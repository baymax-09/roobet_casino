import { type Options } from 'amqplib'

import { getCurrentDateTimeISO } from 'src/util/helpers/time'
import {
  type WithdrawalMongo,
  type WithdrawStatus,
} from 'src/modules/withdraw/types'
import { getUserOrigin } from 'src/util/helpers/userOrigin'
import { type CashWithdrawalTransaction } from 'src/vendors/paymentiq/types'

import {
  type PaymentStatus,
  type PaymentPayload,
  type WithdrawalInfo,
} from '../types'
import { publishAndLogMessage } from '../utils'

type SendableWithdrawStatus = Exclude<
  WithdrawStatus,
  'pending' | 'processing' | 'reprocessing' | 'flagged'
>

interface HandleUserWithdrawalArgs {
  withdrawal: WithdrawalInfo
}

export const publishUserWithdrawalMessageToFastTrack = async (
  message: HandleUserWithdrawalArgs,
  messageOptions?: Options.Publish,
) => {
  const { withdrawal } = message
  const { amount, status, paymentId, userId, vendorId } = withdrawal

  // Don't publish message for certain withdraw statuses
  if (!isSendableWithdrawStatus(status)) {
    return
  }

  const messagePayload: PaymentPayload = {
    amount,
    currency: 'USD',
    exchange_rate: 1, // For now, our exchange rate will just be 1; Our amounts are always in USD
    // fee_amount: 0, // Do we keep track of this? Maybe on the transactions
    origin: getUserOrigin(userId),
    payment_id: paymentId,
    status: mapWithdrawalStatusToPaymentStats(status),
    timestamp: getCurrentDateTimeISO(),
    type: 'Debit',
    user_id: userId,
    vendor_id: vendorId,
  }

  const options = {
    ...messageOptions,
    type: 'PAYMENT',
    persistent: true,
    headers: { cc: 'fasttrack' },
  }

  await publishAndLogMessage(
    'events.userWithdrawal',
    messagePayload,
    options,
    userId,
  )
}

const isSendableWithdrawStatus = (
  status: WithdrawStatus,
): status is SendableWithdrawStatus => {
  const dontSendOnWithdrawStatus: Array<Partial<WithdrawStatus>> = [
    'pending',
    'processing',
    'reprocessing',
    'flagged',
  ]
  return !dontSendOnWithdrawStatus.includes(status)
}

const mapWithdrawalStatusToPaymentStats = (
  withdrawalStatus: SendableWithdrawStatus,
): PaymentStatus => {
  const statusMap: Record<SendableWithdrawStatus, PaymentStatus> = {
    cancelled: 'Cancelled',
    completed: 'Approved',
    declined: 'Rejected',
    failed: 'Cancelled',
    initiated: 'Requested',
  }
  return statusMap[withdrawalStatus]
}

export const FASTTRACK_WITHDRAWAL_FIELDS: Readonly<
  Array<keyof CashWithdrawalTransaction | keyof WithdrawalMongo>
> = ['status']
