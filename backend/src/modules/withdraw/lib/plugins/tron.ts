import { checkSystemEnabled } from 'src/modules/userSettings'
import { createNotification } from 'src/modules/user'
import { countUnconfirmedTransactionsByUserId } from 'src/modules/deposit/documents/deposit_transactions_mongo'
import { APIValidationError } from 'src/util/errors'
import { translateForUser } from 'src/util/i18n'
import {
  modifyUserFee,
  derivePrimaryWallet,
  estimateTronBandwidth,
  withdrawTrx,
} from 'src/modules/crypto/tron/lib'
import { getProvider } from 'src/modules/crypto/tron/util/getProvider'
import { DepositTypes } from 'src/modules/deposit'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

import { updateWithdrawalStatus } from '../../documents/withdrawals_mongo'

import { type Plugin, WithdrawStatusEnum } from '../../types'

const send: Plugin['send'] = async (user, withdrawal) => {
  const message = translateForUser(user, 'withdrawal__pending')
  await updateWithdrawalStatus(withdrawal.id, WithdrawStatusEnum.PENDING)
  await createNotification(user.id, message, 'withdraw')

  return { status: WithdrawStatusEnum.PENDING }
}

export const sendBackground: Plugin['sendBackground'] = async (
  user,
  withdrawal,
  network,
) => {
  if (network === 'Tron') {
    await withdrawTrx(user, withdrawal)
  }

  return null
}

const validate: Plugin['validate'] = async (user, withdrawal, network) => {
  const { totalValue } = withdrawal

  const isEnabled = await checkSystemEnabled(user, 'tronwithdraw')

  if (!isEnabled || network !== 'Tron') {
    throw new APIValidationError('withdrawal__disabled')
  }

  if (!user.twofactorEnabled) {
    throw new APIValidationError('withdraw__2fa_required')
  }

  const unconfCount = await countUnconfirmedTransactionsByUserId(user.id)
  if (unconfCount > 0) {
    throw new APIValidationError('withdraw__must_confirm_deposits', ['TRON 19'])
  }

  if (!withdrawal.fields.address || withdrawal.fields.address === undefined) {
    throw new APIValidationError('withdrawal__invalid_address')
  }

  const validAddress = getProvider().isAddress(withdrawal.fields.address)
  if (!validAddress) {
    throw new APIValidationError('withdrawal__invalid_address')
  }

  const ourWallet = derivePrimaryWallet().address === withdrawal.fields.address
  if (ourWallet) {
    throw new APIValidationError('invalid__withdrawal_self')
  }

  if (totalValue < 10) {
    const convertedMin = await exchangeAndFormatCurrency(10, user)
    throw new APIValidationError('withdrawal__min_plugin', [
      `${DepositTypes.Tron}`,
      `${convertedMin}`,
    ])
  }

  const amount = withdrawal.amount || withdrawal.totalValue
  const estimatedNetworkFee = await estimateTronBandwidth()

  if (estimatedNetworkFee.usd > amount) {
    throw new APIValidationError('withdrawal__fee_greater')
  }

  if (estimatedNetworkFee.usd === amount) {
    throw new APIValidationError('not_enough_balance')
  }

  const tronFee = await modifyUserFee(estimatedNetworkFee)

  return {
    ...withdrawal,
    fields: {
      ...withdrawal.fields,
      // fee in USD
      userFeePaid: tronFee.usd,
    },
  }
}

export const Tron: Plugin = {
  send,
  sendBackground,
  validate,
}
