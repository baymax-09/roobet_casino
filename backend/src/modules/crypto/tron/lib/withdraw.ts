import type TronWeb from 'tronweb'
import TronProvider from 'tronweb'

import { BlockInfoV, BlockTransactionV } from 'src/types/tronweb/controls'
import {
  derivePrimaryWallet,
  convertUserBalanceToTrx,
} from 'src/modules/crypto/tron/lib/wallet'
import { scopedLogger } from 'src/system/logger'
import { type Types as UserTypes } from 'src/modules/user'
import { type Types as WithdrawalTypes } from 'src/modules/withdraw'
import { getProvider } from 'src/modules/crypto/tron/util/getProvider'

import { trxRestApi } from './api'
import { type Transaction, type BlockInfo } from '../types'
import { type WithdrawError, type IOResult } from '../../types'
import { publishTronWithdrawMessage } from '../rabbitmq'

const trxWithdrawLogger = scopedLogger('trx-sendBackground')

export async function getNowBlock(): Promise<
  IOResult<BlockInfo, WithdrawError>
> {
  return await trxRestApi('getnowblock', {}, BlockInfoV)
}

export async function getTransactionFromPending(
  transactionHash: string,
): Promise<IOResult<Transaction, WithdrawError>> {
  const data = {
    value: transactionHash,
  }
  return await trxRestApi('gettransactionfrompending', data, BlockTransactionV)
}

export async function submitTransaction(
  provider: TronWeb,
  transaction: Transaction,
  privateKey: string,
): Promise<string> {
  const {
    raw_data: { contract },
  } = transaction
  const { parameter } = contract[0]
  const toAddress = parameter.value.to_address
  const amount = parameter.value.amount
  const fromAddress = parameter.value.owner_address
  if (toAddress && amount && fromAddress) {
    const tx = await provider.transactionBuilder.sendTrx(
      TronProvider.address.fromHex(toAddress),
      amount,
      TronProvider.address.fromHex(fromAddress),
      0,
    )
    const signed = await provider.trx.sign(tx, privateKey)
    const receipt = await provider.trx.sendRawTransaction(signed)
    if (receipt.result) {
      return receipt.transaction.txID
    }
  }
  throw new Error('Tron - failed to submit transaction')
}

export async function withdrawTrx(
  user: UserTypes.User,
  withdrawal: WithdrawalTypes.CryptoWithdrawal,
): Promise<void> {
  const logger = trxWithdrawLogger('[Tron Withdraw]', {
    userId: withdrawal.userId,
  })
  const {
    totalValue: grossWithdrawalAmountUSD,
    fields: { address: recipient, userFeePaid = 0 },
  } = withdrawal.request

  logger.info(' BEGINS ' + grossWithdrawalAmountUSD, {
    withdrawal,
  })

  if (!recipient) {
    throw new Error(
      `withdrawTron - missing address - ${JSON.stringify(withdrawal)}`,
    )
  }

  logger.info('BEGINS Plugin Typecheck ', { withdrawal })

  if (withdrawal.plugin !== 'tron') {
    throw new Error(
      `withdrawTron - unsupported plugin - ${JSON.stringify(withdrawal)}`,
    )
  }

  const mainWalletAddress = derivePrimaryWallet().address
  const amountToConvert = parseFloat(
    (grossWithdrawalAmountUSD - userFeePaid).toFixed(6),
  )
  const growssWithdrawalAmountTrx =
    await convertUserBalanceToTrx(amountToConvert)
  const provider = getProvider()
  const grossWithdrawalAmountSun = parseFloat(
    provider.toSun(growssWithdrawalAmountTrx),
  )

  logger.info('Check mainWallet Info', { withdrawal })

  const userFeePaidTrx = await convertUserBalanceToTrx(userFeePaid)

  logger.info('Publishing Withdrawal Message', {
    withdrawal,
  })

  const tx = await provider.transactionBuilder.sendTrx(
    recipient,
    grossWithdrawalAmountSun,
    mainWalletAddress,
    0,
  )

  await publishTronWithdrawMessage({
    tx,
    process: 'withdrawal',
    sendTo: {
      walletAddress: recipient,
    },
    fees: {
      userFeePaid: userFeePaidTrx,
      userFeePaidUSD: userFeePaid,
    },
    value: grossWithdrawalAmountUSD,
    withdrawal,
    network: 'Tron',
    token: 'trx',
  })
}
