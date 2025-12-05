import { type Options } from 'amqplib'

import { getUserById } from 'src/modules/user'
import { getCurrentDateTimeISO } from 'src/util/helpers/time'
import { type DepositStatus } from 'src/modules/deposit/types'
import { getUserOrigin } from 'src/util/helpers/userOrigin'
import { getUserFiatCurrency } from 'src/modules/currency/types'
import { type CashDepositTransaction } from 'src/vendors/paymentiq/types'
import { type Deposit } from 'src/modules/deposit/documents/deposit_transactions_mongo'

import { type PaymentStatus, type PaymentPayload } from '../types'
import { type DepositInfo } from './../types/payments'
import { publishAndLogMessage } from '../utils'

interface HandleUserDepositArgs {
  deposit: DepositInfo
}

export const publishUserDepositMessageToFastTrack = async (
  message: HandleUserDepositArgs,
  messageOptions?: Options.Publish,
) => {
  const { deposit } = message
  const { paymentId, amount, vendorId, status, userId } = deposit

  const user = await getUserById(userId)
  const totalDeposits = user?.hiddenTotalDeposits

  // Don't publish message on 'pending' status
  if (status === 'pending') {
    return
  }

  const messagePayload: PaymentPayload = {
    amount,
    currency: getUserFiatCurrency(userId),
    exchange_rate: 1, // For now, our exchange rate will just be 1; Our amounts are always in USD
    // fee_amount: 0, // Do we keep track of this? Maybe on the transactions
    origin: getUserOrigin(userId),
    payment_id: paymentId,
    status: mapDepositStatusToPaymentStats(status),
    timestamp: getCurrentDateTimeISO(),
    type: 'Credit',
    user_id: deposit.userId,
    vendor_id: vendorId,
    deposit_count: totalDeposits ?? 0,
  }

  const options = {
    ...messageOptions,
    type: 'PAYMENT',
    persistent: true,
    headers: { cc: 'fasttrack' },
  }

  await publishAndLogMessage(
    'events.userDeposit',
    messagePayload,
    options,
    userId,
  )
}

const mapDepositStatusToPaymentStats = (
  depositStatus: Exclude<DepositStatus, 'pending'>,
): PaymentStatus => {
  const statusMap: Record<Exclude<DepositStatus, 'pending'>, PaymentStatus> = {
    cancelled: 'Cancelled',
    completed: 'Approved',
    declined: 'Rejected',
    failed: 'Cancelled',
    initiated: 'Requested',
  }
  return statusMap[depositStatus]
}

export const FASTTRACK_DEPOSIT_FIELDS: Readonly<
  Array<keyof CashDepositTransaction | keyof Deposit>
> = ['status']
