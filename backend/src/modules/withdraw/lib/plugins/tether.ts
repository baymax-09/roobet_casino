import { APIValidationError } from 'src/util/errors'
import { checkSystemEnabled } from 'src/modules/userSettings'
import { createNotification } from 'src/modules/user'
import { translateForUser } from 'src/util/i18n'
import { countUnconfirmedTransactionsByUserId } from 'src/modules/deposit/documents/deposit_transactions_mongo'

import { updateWithdrawalStatus } from '../../documents/withdrawals_mongo'
import { type Plugin } from '../../types'
import { WithdrawStatusEnum } from '../../types'
import {
  validateWithdraw,
  withdrawERC20,
} from 'src/modules/crypto/ethereum/lib/withdraw'

export const sendBackground: Plugin['sendBackground'] = async (
  user,
  withdrawal,
  network,
) => {
  if (network === 'Ethereum') {
    await withdrawERC20(user, withdrawal)
  }

  return null
}

const send: Plugin['send'] = async (user, withdrawal) => {
  const message = translateForUser(user, 'withdrawal__pending')
  await updateWithdrawalStatus(withdrawal.id, WithdrawStatusEnum.PENDING)
  await createNotification(user.id, message, 'withdraw')

  return { status: WithdrawStatusEnum.PENDING }
}

const validate: Plugin['validate'] = async (user, withdrawal, network) => {
  const { totalValue } = withdrawal
  const isEnabled = await checkSystemEnabled(user, 'tetherwithdraw')
  const isValidNetwork = network === 'Ethereum'

  if (!isEnabled || !isValidNetwork) {
    throw new APIValidationError('withdrawal__disabled')
  }

  if (!user.twofactorEnabled) {
    throw new APIValidationError('withdraw__2fa_required')
  }

  if (!withdrawal.fields.address || withdrawal.fields.address === undefined) {
    throw new APIValidationError('withdrawal__invalid_address')
  }

  const unconfCount = await countUnconfirmedTransactionsByUserId(user.id)
  if (unconfCount > 0) {
    throw new APIValidationError('withdraw__must_confirm_deposits', [
      'BTC 1, ETH 3',
    ])
  }

  const validationResult = await validateWithdraw(
    user,
    withdrawal.fields.address,
    totalValue,
    'tether',
  )
  if (!validationResult.success) {
    throw validationResult.error
  }

  const { fee, checksumAddress } = validationResult.result

  return {
    ...withdrawal,
    fields: {
      ...withdrawal.fields,
      address: checksumAddress,
      userFeePaid: fee,
    },
  }
}

export const Tether: Plugin = {
  send,
  sendBackground,
  validate,
}
