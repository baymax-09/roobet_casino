import numeral from 'numeral'

import { io } from 'src/system'
import { tuid } from 'src/util/i18n'
import { afterDepositHooks } from 'src/modules/deposit/lib/hooks'
import { slackTransaction, slackTransactionHr } from 'src/vendors/slack'
import { createNotification } from 'src/modules/user'
import { getCryptoUrl } from 'src/modules/crypto/lib'
import { type User, type BalanceType } from 'src/modules/user/types'
import { type Deposit } from 'src/modules/deposit/documents/deposit_transactions_mongo'
import { ethWithdrawalPluginTokenMap } from 'src/modules/withdraw/lib/plugins'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

import { type BlockioWallet } from '../documents/blockio_wallets'
import {
  isEthereumCryptoLowercaseName,
  type EthereumWallet,
  isERC20Token,
} from '../ethereum/types'
import { type CryptoLowercase, type IUserWallet } from '../types'
import { createWalletBalance } from '../ethereum/documents/ethereum_balances'
import { cryptoLogger } from './logger'

interface PostDepositArgs {
  user: User
  wallet: IUserWallet | BlockioWallet | EthereumWallet
  confirmations: number
  precredit: boolean
  userCredits: number
  cryptoType: CryptoLowercase
  transactionId: string
  depositTransactionId: string
  balanceType: BalanceType
  existingDeposit: Deposit
}

export async function postDepositHooks({
  user,
  wallet,
  confirmations,
  precredit,
  transactionId,
  cryptoType,
  userCredits,
  depositTransactionId,
  balanceType,
  existingDeposit,
}: PostDepositArgs) {
  const firstTimeDeposit = user.hiddenTotalDeposits === 0
  const cryptoUrl = getCryptoUrl(cryptoType, transactionId)
  const confirmationsString =
    confirmations || (precredit ? 'precredit' : 'instant')

  slackTransaction(
    `*${user.name}* [${wallet.userId}] deposited *${numeral(userCredits).format(
      '$0,0.00',
    )}* with ${cryptoType}. ${cryptoUrl}
    - [confirmations=${confirmationsString}]`,
  )
  if (userCredits >= 100) {
    slackTransactionHr(
      `*${user.name}* [${wallet.userId}] deposited *${numeral(
        userCredits,
      ).format('$0,0.00')}* with ${cryptoType}. ${cryptoUrl}
      - [confirmations=${confirmationsString}]`,
    )
  }
  if (precredit) {
    const convertedCredits = await exchangeAndFormatCurrency(userCredits, user)
    await createNotification(
      wallet.userId,
      `We've instant-credited your deposit of ${convertedCredits}. Please note, you'll need to wait 1 confirmation to withdraw.`,
      'deposit',
      { amount: userCredits, transactionId, type: cryptoType },
    )
  } else {
    const convertedCredits = await exchangeAndFormatCurrency(userCredits, user)
    await createNotification(
      wallet.userId,
      await tuid(wallet.userId, 'crypto__deposit_confirmed', [
        `${convertedCredits}`,
      ]),
      'deposit',
      { amount: userCredits, transactionId, type: cryptoType },
    )
  }

  afterDepositHooks(user, existingDeposit.amount, balanceType)

  io.to(user.id).emit('newDeposit', {
    transactionId: depositTransactionId,
    type: cryptoType,
    amount: userCredits,
    firstTimeDeposit,
  })

  try {
    if (isEthereumCryptoLowercaseName(cryptoType)) {
      const token = ethWithdrawalPluginTokenMap[cryptoType]
      if (isERC20Token(token)) {
        await createWalletBalance({
          address: wallet.address,
          token,
          actionRequired: 'fund',
          processing: false,
        })
      } else {
        await createWalletBalance({
          address: wallet.address,
          token: 'eth',
          actionRequired: 'pool',
          processing: false,
        })
      }
    }
  } catch (error) {
    cryptoLogger('postDepositHooks', { userId: user.id }).error(
      `Error updating wallet - ${error.message}`,
      {
        user,
        wallet,
        confirmations,
        precredit,
        transactionId,
        cryptoType,
        userCredits,
        depositTransactionId,
        balanceType,
        existingDeposit,
      },
      error,
    )
  }
}
