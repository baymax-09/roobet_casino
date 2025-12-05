import { type Types } from 'mongoose'

import { MongoErrorCodes } from 'src/system'
import { createNotification } from 'src/modules/user'
import { type User } from 'src/modules/user/types'
import { type Currency } from 'src/modules/currency/types'
import { tuid } from 'src/util/i18n'
import { checkSystemEnabled } from 'src/modules/userSettings'
import { type CryptoNetwork } from 'src/modules/crypto/types'

import {
  createDepositTransaction,
  updateDepositTransactionById,
  type Deposit,
} from '../documents/deposit_transactions_mongo'
import { DepositStatuses, ReasonCodes, requiredConfirmations } from './util'
import { type CryptoDepositType, isValidCryptoDepositType } from '../types'
import { depositLogger } from './logger'

interface DepositPayload {
  id: string
  userId: string
  depositType: CryptoDepositType
  network: CryptoNetwork
  amount: number
  currency: Currency
  externalId: string
  confirmations: number
  meta: object
}

interface StartDepositArgs {
  amount: number
  currency: Currency
  depositType: CryptoDepositType
  network: CryptoNetwork
  user: User
  depositId: string

  ip?: string
  session?: {
    id: string
    data: string
  }
  confirmations?: number
  externalId?: string
  meta?: object
  forcedReprocess?: boolean
}

/** If the deposit already exists, then we should not continue with processing it */
export async function recordDepositTransaction(
  payload: DepositPayload,
): Promise<{ deposit: Deposit | null; alreadyExists: boolean }> {
  try {
    const newDeposit = await createDepositTransaction(payload)
    return {
      deposit: newDeposit,
      alreadyExists: false,
    }
  } catch (error) {
    if (error.code === MongoErrorCodes.DUPLICATE_KEY) {
      const update = {
        id: payload.id,
        confirmations: payload.confirmations,
        amount: payload.amount,
      }
      const updatedDeposit = await updateDepositTransactionById(update)
      return {
        deposit: updatedDeposit,
        alreadyExists: true,
      }
    }
    depositLogger('recordDepositTransaction', { userId: payload.userId }).error(
      `Error when trying to create deposit for ${payload.userId} on ${payload.externalId}`,
      error,
    )
    throw error
  }
}

/**
 * @todo Error check for simultaneous transaction attempts.
 * @todo add update, and cancel functions to standardize deposit process
 * @todo On second thought, we should break out these functions into separate crypto and cash versions
 * @param amount can be null FYI - like in bitcoin case
 */
export async function startDeposit({
  user,
  depositType,
  amount,
  currency,
  network,
  confirmations = 0,

  depositId,
  meta = {},
  externalId = '',
  forcedReprocess = false,
}: StartDepositArgs): Promise<Types.ObjectId | null> {
  const requiredConfs = isValidCryptoDepositType(depositType)
    ? requiredConfirmations[depositType]
    : null

  const isEnabled = await checkSystemEnabled(user, 'deposit')

  // TODO improve error handling here
  if (!isEnabled) {
    throw 'action__disabled'
  }

  const payload = {
    id: depositId,
    userId: user.id,
    depositType,
    network,
    amount,
    currency,
    externalId,
    confirmations,
    meta,
  }

  const result = await recordDepositTransaction(payload)
  const stopCondition =
    result.alreadyExists &&
    result.deposit?.status === DepositStatuses.Completed &&
    !forcedReprocess
  if (stopCondition || !result.deposit) {
    depositLogger('startDeposit', { userId: user.id }).info(
      `DepositStopped - Deposit: ${result}, Reason: ${ReasonCodes.ALREADY_EXISTS.message}, alreadyExists: ${result.alreadyExists}`,
      {
        deposit: result,
        reason: ReasonCodes.ALREADY_EXISTS.message,
        alreadyExists: result.alreadyExists,
      },
    )
    return null
  }

  if (requiredConfs && result.deposit && !result.alreadyExists) {
    await createNotification(
      user.id,
      await tuid(user.id, 'deposit__received_waiting_confs', [
        `${requiredConfs}`,
      ]),
      'deposit',
      { amount },
    )
  }

  return result.deposit._id
}
