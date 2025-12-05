import { BasicCache } from 'src/util/redisModels'
import { config } from 'src/system'
import { checkSystemEnabled } from 'src/modules/userSettings'
import {
  convertLitecoinToUserBalance,
  convertUserBalanceToLitecoin,
} from 'src/modules/crypto/litecoin/lib'
import { APIValidationError } from 'src/util/errors'
import { litecoinBlockioApi } from 'src/vendors/blockio'
import { translateForUser } from 'src/util/i18n'
import { createNotification } from 'src/modules/user'
import { countUnconfirmedTransactionsByUserId } from 'src/modules/deposit/documents/deposit_transactions_mongo'
import { recordSentTransfer } from 'src/vendors/chainalysis'
import { DepositTypes } from 'src/modules/deposit'
import { getBlockioWalletByAddress } from 'src/modules/crypto/lib/wallet'
import { createOutgoingTransaction } from 'src/modules/crypto/documents/outgoing_transactions'
import { getGeneralBlockchainInfo } from 'src/modules/crypto/lib/blockexplorer'

import {
  updateWithdrawal,
  updateWithdrawalStatus,
} from '../../documents/withdrawals_mongo'
import { WithdrawStatusEnum, type Plugin } from '../../types'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { withdrawLogger } from '../logger'

const { maxFeeUSD } = config.litecoin

const send: Plugin['send'] = async (user, withdrawal) => {
  const message = translateForUser(user, 'withdrawal__pending')
  await updateWithdrawalStatus(withdrawal.id, WithdrawStatusEnum.PENDING)

  await createNotification(user.id, message, 'withdraw')

  return { status: WithdrawStatusEnum.PENDING }
}

const sendBackground: Plugin['sendBackground'] = async (
  user,
  withdrawal,
  network,
) => {
  const logger = withdrawLogger('litecoin/sendBackground', { userId: user.id })
  const {
    totalValue,
    fields: { address, userFeePaid = 0 },
  } = withdrawal.request

  if (network !== 'Litecoin') {
    return null
  }

  const amountLitecoin = parseFloat(
    (await convertUserBalanceToLitecoin(totalValue - userFeePaid)).toFixed(8),
  )

  try {
    const estimatedNetworkFee = await litecoinBlockioApi.getNetworkFeeEstimate({
      amounts: `${amountLitecoin}`,
      priority: 'high',
      to_addresses: `${address}`,
    })
    const data = await litecoinBlockioApi.withdraw({
      amounts: `${amountLitecoin}`,
      priority: 'custom',
      custom_network_fee: `${estimatedNetworkFee}`,
      to_addresses: `${address}`,
    })
    const convertedAmount = await exchangeAndFormatCurrency(totalValue, user)
    try {
      const message = translateForUser(user, 'withdrawal__convertedSent', [
        convertedAmount,
      ])
      await createNotification(user.id, message, 'withdraw', {
        amount: totalValue,
        to: address,
        transactionId: data.txid,
        type: 'litecoin',
      })

      const fee = parseFloat(estimatedNetworkFee)
      const userFeePaidLTC = await convertUserBalanceToLitecoin(userFeePaid)
      const totalFeePaidUSD = await convertLitecoinToUserBalance(fee)

      let latestBlockHeight = 0
      try {
        const latestBlock = await getGeneralBlockchainInfo('Litecoin')
        if (latestBlock) {
          latestBlockHeight = latestBlock.height
        }
      } catch {}

      await createOutgoingTransaction({
        network: 'Litecoin',
        transactionHash: data.txid,
        token: 'ltc',
        value: amountLitecoin,
        blockSent: latestBlockHeight,
        fees: {
          userFeePaid: userFeePaidLTC,
          totalFeePaid: fee,
          userFeePaidUSD: userFeePaid,
          totalFeePaidUSD,
        },
      })

      if (address) {
        recordSentTransfer(user.id, data.txid, address, 'litecoin')
      }
    } catch (error) {
      logger.error('error sending blockio withdrawal', error)
    }

    const updatedWithdraw = await updateWithdrawal(withdrawal.id, {
      transactionId: data.txid,
      status: WithdrawStatusEnum.COMPLETED,
    })
    logger.info(`Updated withdraw: ${updatedWithdraw}`, {
      updatedWithdraw,
      address,
    })

    return data.txid
  } catch (error) {
    logger.error(
      `Attempt to send ${amountLitecoin} to ${address} failed`,
      { amountLitecoin, address },
      error,
    )
    throw error
  }
}
const validate: Plugin['validate'] = async (user, withdrawal, network) => {
  const { totalValue } = withdrawal
  const isEnabled = await checkSystemEnabled(user, 'litecoinwithdraw')

  if (!isEnabled || network !== 'Litecoin') {
    throw new APIValidationError('withdrawal__disabled')
  }

  if (!user.twofactorEnabled) {
    throw new APIValidationError('withdraw__2fa_required')
  }

  const unconfCount = await countUnconfirmedTransactionsByUserId(user.id)
  if (unconfCount > 0) {
    throw new APIValidationError('withdraw__must_confirm_deposits', [
      'BTC 1, ETH 3',
    ])
  }

  if (!withdrawal.fields.address || withdrawal.fields.address === undefined) {
    throw new APIValidationError('withdrawal__invalid_address')
  }

  if (totalValue < 10) {
    const convertedMin = await exchangeAndFormatCurrency(10, user)
    throw new APIValidationError('withdrawal__min_plugin', [
      `${DepositTypes.Litecoin}`,
      `${convertedMin}`,
    ])
  }

  withdrawal.fields.address = withdrawal.fields.address.trim()

  const ourWallet = await getBlockioWalletByAddress(withdrawal.fields.address)
  if (ourWallet) {
    throw new APIValidationError('invalid__withdrawal_self')
  }

  if (!(await litecoinBlockioApi.isValidAddress(withdrawal.fields.address))) {
    throw new APIValidationError('withdrawal__invalid_address')
  }

  const amount = withdrawal.amount || totalValue
  const amountInLTC = await convertUserBalanceToLitecoin(amount)

  try {
    const estimatedNetworkFee = await litecoinBlockioApi.getNetworkFeeEstimate({
      amounts: `${amountInLTC.toFixed(8)}`,
      priority: 'high',
      to_addresses: `${withdrawal.fields.address}`,
    })

    const feeInUSD = await convertLitecoinToUserBalance(
      parseFloat(estimatedNetworkFee),
    )
    const adjustedFee = Math.min(feeInUSD, maxFeeUSD)

    if (adjustedFee > amount) {
      throw new APIValidationError('withdrawal__fee_greater')
    }

    if (adjustedFee === amount) {
      throw new APIValidationError('not_enough_balance')
    }

    if (amount - adjustedFee < 2) {
      const convertedAmount = await exchangeAndFormatCurrency(2, user)
      throw new APIValidationError('withdrawal__convertedAmt_after_fee', [
        `${convertedAmount}`,
      ])
    }

    return {
      ...withdrawal,
      fields: {
        ...withdrawal.fields,
        // fee in uSD
        userFeePaid: adjustedFee,
      },
    }
  } catch (error) {
    if (
      error &&
      error.message &&
      error.message.includes('Cannot withdraw funds without Network Fee')
    ) {
      const feeResult = await BasicCache.get('ltc/fee', 'short')
      if (feeResult) {
        return {
          ...withdrawal,
          fields: {
            ...withdrawal.fields,
            // fee in USD
            userFeePaid: feeResult,
          },
        }
      }
      return {
        ...withdrawal,
        fields: {
          ...withdrawal.fields,
          // fee in USD
          userFeePaid: 0,
        },
      }
    }

    throw error
  }
}

export const Litecoin: Plugin = {
  send,
  sendBackground,
  validate,
}
