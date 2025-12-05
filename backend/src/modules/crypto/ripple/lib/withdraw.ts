import { xrpToDrops, type Transaction } from 'xrpl'

import { type Types as UserTypes } from 'src/modules/user'
import { type Types as WithdrawalTypes } from 'src/modules/withdraw'

import { publishRippleWithdrawMessage } from '../rabbitmq'
import {
  derivePrimaryWallet,
  convertUserBalanceToXrp,
  estimateRippleFee,
} from '.'
import { cryptoLogger } from '../../lib/logger'

export async function withdrawXrp(
  user: UserTypes.User,
  withdrawal: WithdrawalTypes.CryptoWithdrawal,
): Promise<void> {
  const logger = cryptoLogger('ripple/withdraw/withdrawXrp', {
    userId: user.id,
  })
  const {
    totalValue: grossWithdrawalAmountUSD,
    fields: { address: recipient, userFeePaid = 0, tag = '' },
  } = withdrawal.request

  logger.info(
    `Begin withdrawl of $${grossWithdrawalAmountUSD} - ${withdrawal}`,
    { withdrawal },
  )

  if (!recipient) {
    throw new Error(
      `withdrawXrp - missing address - ${JSON.stringify(withdrawal)}`,
    )
  }

  logger.info(`Begin Plugin Typecheck - ${withdrawal}`, { withdrawal })

  if (withdrawal.plugin !== 'ripple') {
    throw new Error(
      `withdrawXrp - unsupported plugin - ${JSON.stringify(withdrawal)}`,
    )
  }

  const mainWalletAddress = derivePrimaryWallet().classicAddress
  const amountToConvert = parseFloat(
    (grossWithdrawalAmountUSD - userFeePaid).toFixed(6),
  )
  const growssWithdrawalAmountXrp =
    await convertUserBalanceToXrp(amountToConvert)
  const grossWithdrawalAmountDrop = xrpToDrops(growssWithdrawalAmountXrp)
  const { drops } = await estimateRippleFee()

  logger.info(`Check mainWallet Info - ${withdrawal}`, { withdrawal })

  const userFeePaidXrp = await convertUserBalanceToXrp(userFeePaid)

  logger.info(`Publishing Withdrawal Message - ${withdrawal}`, { withdrawal })

  let tx: Transaction = {
    TransactionType: 'Payment',
    Fee: Math.ceil(drops * 1.5).toString(), // 50% dump above the average
    Destination: recipient,
    Account: mainWalletAddress,
    Amount: grossWithdrawalAmountDrop,
  }

  if (tag) {
    tx = {
      ...tx,
      DestinationTag: Number(tag),
    }
  }

  await publishRippleWithdrawMessage({
    tx,
    process: 'withdrawal',
    sendTo: {
      walletAddress: recipient,
    },
    fees: {
      userFeePaid: userFeePaidXrp,
      userFeePaidUSD: userFeePaid,
    },
    value: grossWithdrawalAmountUSD,
    withdrawal,
    network: 'Ripple',
    token: 'xrp',
  })
}
