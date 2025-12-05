import { BasicCache } from 'src/util/redisModels'
import { config } from 'src/system'
import { scopedLogger } from 'src/system/logger'
import { checkSystemEnabled } from 'src/modules/userSettings'
import {
  convertUserBalanceToDogecoin,
  convertDogecoinToUserBalance,
} from 'src/modules/crypto/dogecoin'
import { APIValidationError } from 'src/util/errors'
import { dogecoinBlockioApi } from 'src/vendors/blockio'
import { translateForUser } from 'src/util/i18n'
import { createNotification } from 'src/modules/user'
import { countUnconfirmedTransactionsByUserId } from 'src/modules/deposit/documents/deposit_transactions_mongo'
import { recordSentTransfer } from 'src/vendors/chainalysis'
import { DepositTypes } from 'src/modules/deposit'
import { getBlockioWalletByAddress } from 'src/modules/crypto/lib/wallet'
import { createOutgoingTransaction } from 'src/modules/crypto/documents/outgoing_transactions'
import { getGeneralBlockchainInfo } from 'src/modules/crypto/lib/blockexplorer'
import { checkFeePaidByUser } from 'src/modules/withdraw/lib/util'

import {
  updateWithdrawal,
  updateWithdrawalStatus,
} from '../../documents/withdrawals_mongo'
import { WithdrawStatusEnum, type Plugin } from '../../types'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

const { maxFeeUSD } = config.dogecoin

export const withdrawPluginLogger = scopedLogger('withdrawPlugin')

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
  const {
    totalValue,
    fields: { address, userFeePaid = 0 },
  } = withdrawal.request

  if (network !== 'Dogecoin') {
    return null
  }

  const amountDogecoin = parseFloat(
    (await convertUserBalanceToDogecoin(totalValue - userFeePaid)).toFixed(8),
  )
  const logger = withdrawPluginLogger('dogeSendBackground', { userId: user.id })

  try {
    const estimatedNetworkFee = await dogecoinBlockioApi.getNetworkFeeEstimate({
      amounts: `${amountDogecoin}`,
      priority: 'high',
      to_addresses: `${address}`,
    })
    const customFee = parseFloat(estimatedNetworkFee) * 1.005 + 0.00192 // get max fee because it's so little money anyway
    const customFeeStringified = customFee.toFixed(8)

    const data = await dogecoinBlockioApi.withdraw({
      amounts: `${amountDogecoin}`,
      priority: 'custom',
      custom_network_fee: `${customFeeStringified}`,
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
        type: 'dogecoin',
      })

      const userFeePaidDoge = await convertUserBalanceToDogecoin(userFeePaid)
      const totalFeePaidUSD = await convertDogecoinToUserBalance(customFee)

      let latestBlockHeight = 0
      try {
        const latestBlock = await getGeneralBlockchainInfo('Dogecoin')
        if (latestBlock) {
          latestBlockHeight = latestBlock.height
        }
      } catch {}

      await createOutgoingTransaction({
        network: 'Dogecoin',
        transactionHash: data.txid,
        token: 'doge',
        value: amountDogecoin,
        blockSent: latestBlockHeight,
        fees: {
          userFeePaid: userFeePaidDoge,
          totalFeePaid: customFee,
          userFeePaidUSD: userFeePaid,
          totalFeePaidUSD,
        },
      })

      if (address) {
        recordSentTransfer(user.id, data.txid, address, 'dogecoin')
      }
    } catch (error) {
      logger.error(
        'Failed to send dogecoin for withdrawal',
        { txId: data.txid, address },
        error,
      )
    }

    const updatedWithdraw = await updateWithdrawal(withdrawal.id, {
      transactionId: data.txid,
      status: WithdrawStatusEnum.COMPLETED,
    })
    logger.info('Updated withdraw for doge', { updatedWithdraw })

    return data.txid
  } catch (error) {
    logger.error(
      `Attempt to send ${amountDogecoin} to ${address} failed`,
      {},
      error,
    )
    throw error
  }
}

const validate: Plugin['validate'] = async (user, withdrawal, network) => {
  const { totalValue } = withdrawal
  const isEnabled = await checkSystemEnabled(user, 'dogecoinwithdraw')

  if (!isEnabled || network !== 'Dogecoin') {
    throw new APIValidationError('withdrawal__disabled')
  }

  if (!user.twofactorEnabled) {
    throw new APIValidationError('withdraw__2fa_required')
  }

  const unconfCount = await countUnconfirmedTransactionsByUserId(user.id)
  if (unconfCount > 0) {
    throw new APIValidationError('withdraw__must_confirm_deposits', ['DOGE 1'])
  }

  if (!withdrawal.fields.address || withdrawal.fields.address === undefined) {
    throw new APIValidationError('withdrawal__invalid_address')
  }

  if (totalValue < 10) {
    const convertedMin = await exchangeAndFormatCurrency(10, user)
    throw new APIValidationError('withdrawal__min_plugin', [
      `${DepositTypes.Dogecoin}`,
      `${convertedMin}`,
    ])
  }

  withdrawal.fields.address = withdrawal.fields.address.trim()

  const ourWallet = await getBlockioWalletByAddress(withdrawal.fields.address)
  if (ourWallet) {
    throw new APIValidationError('invalid__withdrawal_self')
  }

  if (!(await dogecoinBlockioApi.isValidAddress(withdrawal.fields.address))) {
    throw new APIValidationError('withdrawal__invalid_address')
  }

  const amount = withdrawal.amount || totalValue
  const amountInDoge = await convertUserBalanceToDogecoin(amount)

  try {
    const estimatedNetworkFee = await dogecoinBlockioApi.getNetworkFeeEstimate({
      amounts: `${amountInDoge.toFixed(8)}`,
      priority: 'high',
      to_addresses: `${withdrawal.fields.address}`,
    })

    const feeInUSD = await convertDogecoinToUserBalance(
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
        userFeePaid: checkFeePaidByUser(adjustedFee),
      },
    }
  } catch (error) {
    if (
      error &&
      error.message &&
      error.message.includes('Cannot withdraw funds without Network Fee')
    ) {
      const feeResult = await BasicCache.get('doge/fee', 'short')

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

export const Dogecoin: Plugin = {
  send,
  sendBackground,
  validate,
}
