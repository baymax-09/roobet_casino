import WAValidator from 'wallet-address-validator'

import { BasicCache } from 'src/util/redisModels'
import { config } from 'src/system'
import { checkSystemEnabled } from 'src/modules/userSettings'
import {
  convertBitcoinToUserBalance,
  convertUserBalanceToBitcoin,
} from 'src/modules/crypto/bitcoin'
import { APIValidationError } from 'src/util/errors'
import { translateForUser } from 'src/util/i18n'
import { createNotification } from 'src/modules/user'
import { countUnconfirmedTransactionsByUserId } from 'src/modules/deposit/documents/deposit_transactions_mongo'
import { recordSentTransfer } from 'src/vendors/chainalysis'
import { useBlockioApi } from 'src/vendors/blockio/lib/api'
import { DepositTypes } from 'src/modules/deposit'
import { getBlockioWalletByAddress } from 'src/modules/crypto/lib/wallet'
import { createOutgoingTransaction } from 'src/modules/crypto/documents/outgoing_transactions'
import { getGeneralBlockchainInfo } from 'src/modules/crypto/lib/blockexplorer'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

import {
  updateWithdrawal,
  updateWithdrawalStatus,
} from '../../documents/withdrawals_mongo'
import { WithdrawStatusEnum, type Plugin } from '../../types'
import { withdrawLogger } from '../logger'

const blockioApi = useBlockioApi('btc')

const send: Plugin['send'] = async (user, withdrawal) => {
  const message = translateForUser(user, 'withdrawal__pending')
  await updateWithdrawalStatus(withdrawal.id, WithdrawStatusEnum.PENDING)
  await createNotification(user.id, message, 'withdraw')

  return { status: WithdrawStatusEnum.PENDING }
}

const { maxFeeUSD, withdrawalAddress: mainWalletAddress } = config.bitcoin

export const sendBackground: Plugin['sendBackground'] = async (
  user,
  withdrawal,
  network,
) => {
  const logger = withdrawLogger('bitcoin/sendBackground', { userId: user.id })
  const {
    totalValue,
    fields: { address, userFeePaid = 0 },
  } = withdrawal.request

  if (network !== 'Bitcoin') {
    return null
  }

  const amountBitcoin = parseFloat(
    (await convertUserBalanceToBitcoin(totalValue - userFeePaid)).toFixed(8),
  )

  try {
    const estimatedNetworkFee = await blockioApi.getNetworkFeeEstimate({
      amounts: `${amountBitcoin}`,
      priority: 'high',
      to_addresses: `${address}`,
      from_addresses: mainWalletAddress,
    })
    const customFee = parseFloat(estimatedNetworkFee) * 1.35
    const customFeeStringified = customFee.toFixed(8)

    const data = await blockioApi.withdraw({
      amounts: `${amountBitcoin}`,
      priority: 'custom',
      custom_network_fee: `${customFeeStringified}`,
      to_addresses: `${address}`,
      from_addresses: mainWalletAddress,
    })

    const updatedWithdraw = await updateWithdrawal(withdrawal.id, {
      transactionId: data.txid,
      status: WithdrawStatusEnum.COMPLETED,
    })
    logger.info(`BTC - updated withdraw ${updatedWithdraw}`, {
      updatedWithdraw,
    })

    try {
      const convertedAmount = await exchangeAndFormatCurrency(totalValue, user)
      const message = translateForUser(user, 'withdrawal__convertedSent', [
        convertedAmount,
      ])
      await createNotification(user.id, message, 'withdraw', {
        to: address,
        transactionId: data.txid,
        amount: totalValue,
        type: 'bitcoin',
      })

      const userFeePaidBTC = await convertUserBalanceToBitcoin(userFeePaid)
      const totalFeePaidUSD = await convertBitcoinToUserBalance(customFee)

      let latestBlockHeight = 0
      try {
        const latestBlock = await getGeneralBlockchainInfo('Bitcoin')
        if (latestBlock) {
          latestBlockHeight = latestBlock.height
        }
      } catch {}

      await createOutgoingTransaction({
        network: 'Bitcoin',
        transactionHash: data.txid,
        token: 'btc',
        value: amountBitcoin,
        blockSent: latestBlockHeight,
        fees: {
          userFeePaid: userFeePaidBTC,
          totalFeePaid: customFee,
          userFeePaidUSD: userFeePaid,
          totalFeePaidUSD,
        },
      })

      if (address) {
        recordSentTransfer(user.id, data.txid, address, 'bitcoin')
      }
    } catch (error) {
      logger.error(
        `Error from withdrawal hooks ${data.txid} ${withdrawal._id}`,
        { transactionId: data.txid, withdrawal, address },
        error,
      )
    }

    return data.txid
  } catch (error) {
    logger.error(
      `Attempt to send ${amountBitcoin} to ${address} failed`,
      { amountBitcoin, address, withdrawal },
      error,
    )
    throw error
  }
}

export const validate: Plugin['validate'] = async (
  user,
  withdrawal,
  network,
) => {
  const { totalValue } = withdrawal
  const isEnabled = await checkSystemEnabled(user, 'bitcoinwithdraw')

  if (!isEnabled || network !== 'Bitcoin') {
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

  if (withdrawal.fields.address === '381NG6n5ZEGztNtUGw1jPvaRmuN5FexfSa') {
    throw new APIValidationError('withdraw__must_confirm_deposits', [
      'BTC 1, ETH 3',
    ])
  }

  if (totalValue < 10) {
    const convertedMin = await exchangeAndFormatCurrency(10, user)
    throw new APIValidationError('withdrawal__min_plugin', [
      `${DepositTypes.Bitcoin}`,
      `${convertedMin}`,
    ])
  }

  withdrawal.fields.address = withdrawal.fields.address.trim()

  const ourWallet = await getBlockioWalletByAddress(withdrawal.fields.address)
  if (ourWallet) {
    throw new APIValidationError('invalid__withdrawal_self')
  }

  const environment = config.isProd ? 'prod' : 'testnet'
  const isValidAddress = WAValidator.validate(
    withdrawal.fields.address,
    'bitcoin',
    environment,
  )
  if (!isValidAddress) {
    throw new APIValidationError('withdrawal__invalid_address')
  }
  const amount = withdrawal.amount || withdrawal.totalValue
  const amountInBTC = await convertUserBalanceToBitcoin(amount)

  try {
    const estimatedNetworkFee = await blockioApi.getNetworkFeeEstimate({
      amounts: `${amountInBTC.toFixed(8)}`,
      priority: 'high',
      to_addresses: `${withdrawal.fields.address}`,
    })

    const feeInUSD = await convertBitcoinToUserBalance(
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
        // fee in USD
        userFeePaid: adjustedFee,
      },
    }
  } catch (error) {
    if (
      error &&
      error.message &&
      error.message.includes('Cannot withdraw funds without Network Fee')
    ) {
      const feeResult = await BasicCache.get('btc/fee', 'short')

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

export const Bitcoin: Plugin = {
  send,
  sendBackground,
  validate,
}
