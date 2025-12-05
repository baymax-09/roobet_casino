import moment from 'moment'

import { createUniqueID } from 'src/util/helpers/id'
import { config } from 'src/system'

import {
  type CashDepositType,
  type CryptoDepositType,
  type CashDepositKey,
  type CryptoDepositKey,
  type DepositKeys,
  type DepositType,
  type DepositStatus,
} from '../types/Deposit'

export const requiredConfirmations: Readonly<
  Record<CryptoDepositType, number>
> = {
  bitcoin: config.bitcoin.deposit.minConfirmations,
  ethereum: config.ethereum.deposit.minConfirmations,
  litecoin: config.litecoin.deposit.minConfirmations,
  tether: config.ethereum.deposit.minConfirmations,
  usdc: config.ethereum.deposit.minConfirmations,
  ripple: config.ripple.deposit.minConfirmations,
  dogecoin: config.dogecoin.deposit.minConfirmations,
  tron: config.tron.deposit.minConfirmations,
}

export const CryptoDepositTypes: Record<CryptoDepositKey, CryptoDepositType> = {
  Bitcoin: 'bitcoin',
  Ethereum: 'ethereum',
  Litecoin: 'litecoin',
  Tether: 'tether',
  USDC: 'usdc',
  Ripple: 'ripple',
  Dogecoin: 'dogecoin',
  Tron: 'tron',
}

export const CashDepositTypes: Record<CashDepositKey, CashDepositType> = {
  PaymentIq: 'paymentIq',
}

export const DepositTypes: Record<DepositKeys, DepositType> = {
  ...CashDepositTypes,
  ...CryptoDepositTypes,
  Test: 'test',
}

enum DepositStatusEnum {
  INITIATED = 'Initiated',
  PENDING = 'Pending',
  CANCELLED = 'Cancelled',
  FAILED = 'Failed',
  DECLINED = 'Declined',
  COMPLETED = 'Completed',
}

/**
 * Initiated -- Deposit transaction has begun.
 * Pending -- We are waiting for a response from the Payment Processor.
 * Cancelled -- User has cancelled their deposit transaction.
 * Failed -- Transaction failed because of an error from the Payment Processor.
 * Declined -- User's deposit request was declined by the Payment Processor.
 * Complete -- Deposit transaction was successful and funds have been transferred.
 */
export const DepositStatuses: Record<DepositStatusEnum, DepositStatus> = {
  [DepositStatusEnum.INITIATED]: 'initiated',
  [DepositStatusEnum.PENDING]: 'pending',
  [DepositStatusEnum.CANCELLED]: 'cancelled',
  [DepositStatusEnum.FAILED]: 'failed',
  [DepositStatusEnum.DECLINED]: 'declined',
  [DepositStatusEnum.COMPLETED]: 'completed',
}

/**
 * Used for error handling.
 * List of ReasonCodes that can be appended to a Deposit Transaction
 * record, if that transaction does not reach Completed status.
 */
export const ReasonCodes = {
  SUCCESS: {
    message: 'Okay',
    response: DepositStatuses.Completed,
    code: 2000,
  },
  NO_TRANSACTION: {
    message:
      'Transaction does not exist. If this was a crypto transaction, then it was either reverted or the block has been discarded.',
    response: DepositStatuses.Failed,
    code: 2001,
  },
  ALREADY_EXISTS: {
    message: 'Deposit Already Exists or has Completed.',
    response: DepositStatuses.Failed,
    code: 2002,
  },
  SEON_CHECK: {
    message: 'Deposit Declined via Seon Fraud Check.',
    response: DepositStatuses.Failed,
    code: 2003,
  },
  CHAINALYSIS_CHECK: {
    message: 'Deposit Declined via Chainalysis - Risky deposit detected',
    response: DepositStatuses.Failed,
    code: 2004,
  },
} as const

/**
 * Checks whether a deposit is too old to process, this is based on the time in which user wallet transactions is
 * cleaned up which is our main method of checking for dupes
 */
export function isDepositTooOld(timestamp: string) {
  return moment(timestamp) < moment().subtract(30, 'days')
}

export function createUniqueDepositId(
  walletId: string,
  type: DepositType,
  transactionHash: string,
) {
  return createUniqueID([walletId, type, transactionHash])
}
