import { type BlockioRawTransaction, type BlockioTransaction } from 'block_io'

import { config } from 'src/system'
import { createUniqueDepositId } from 'src/modules/deposit/lib/util'
import { getUserById } from 'src/modules/user'
import {
  DepositStatuses,
  startDeposit,
  updateDepositTransaction,
} from 'src/modules/deposit'
import { convertLitecoinToUserBalance } from 'src/modules/crypto/litecoin/lib'
import { convertDogecoinToUserBalance } from 'src/modules/crypto/dogecoin/lib'
import { checkSystemEnabled } from 'src/modules/userSettings'
import {
  convertBitcoinToUserBalance,
  checkTxEligiblePrecredit,
} from 'src/modules/crypto/bitcoin'
import {
  addCryptoDeposit,
  depositRedisKeys,
  depositProcessName,
} from 'src/modules/crypto/lib'
import { BasicCache } from 'src/util/redisModels'
import { getBlockioWallet } from 'src/modules/crypto/lib/wallet'
import { type Currency } from 'src/modules/currency/types'
import { type CryptoDepositType } from 'src/modules/deposit/types'
import {
  type BlockioCryptoProperName,
  type BlockioCryptoSymbol,
} from 'src/modules/crypto/types'

import {
  bitcoinBlockioApi,
  litecoinBlockioApi,
  dogecoinBlockioApi,
} from 'src/vendors/blockio'
import { blockioLogger } from './logger'

interface CryptoDepositData {
  convertAmount: (amount: number) => Promise<number>
  depositType: CryptoDepositType
  cryptoType: BlockioCryptoProperName
  minConfirmations: number
  ourPoolingAddress: string
  getTxnData: (transactionId: string) => Promise<BlockioRawTransaction>
}

const requiredConfirmations: Readonly<Record<BlockioCryptoSymbol, number>> = {
  btc: 1,
  ltc: 1,
  doge: 1,
}

// The blockhash is published to the cache which is used by api endpoint `/getCurrentBlock`
async function publishLatestTransaction(
  blockhash: string,
  cryptoType: BlockioCryptoProperName,
) {
  await BasicCache.set(
    depositProcessName,
    depositRedisKeys[cryptoType],
    blockhash,
    60 * 60,
  )
}

export async function processTransactionForCrypto(
  crypto: BlockioCryptoSymbol,
  data: BlockioTransaction,
  forcedReprocess?: boolean,
) {
  const logger = blockioLogger('processTransactionForCrypto', { userId: null })
  const { address, balance_change, amount_sent, txid } = data

  if (parseFloat(amount_sent) > 0 || parseFloat(balance_change) < 0) {
    logger.info('not tracking deposit with balance change < 0')
    return
  }

  const baseCryptoData: Record<BlockioCryptoSymbol, CryptoDepositData> = {
    btc: {
      depositType: 'bitcoin',
      cryptoType: 'Bitcoin',
      minConfirmations: requiredConfirmations.btc,
      ourPoolingAddress: config.bitcoin.poolingAddress,
      convertAmount: convertBitcoinToUserBalance,
      getTxnData: bitcoinBlockioApi.getTransaction,
    },
    ltc: {
      depositType: 'litecoin',
      cryptoType: 'Litecoin',
      minConfirmations: requiredConfirmations.ltc,
      ourPoolingAddress: config.litecoin.poolingAddress,
      convertAmount: convertLitecoinToUserBalance,
      getTxnData: litecoinBlockioApi.getTransaction,
    },
    doge: {
      depositType: 'dogecoin',
      cryptoType: 'Dogecoin',
      minConfirmations: requiredConfirmations.doge,
      ourPoolingAddress: config.dogecoin.poolingAddress,
      convertAmount: convertDogecoinToUserBalance,
      getTxnData: dogecoinBlockioApi.getTransaction,
    },
  }

  const {
    depositType,
    cryptoType,
    minConfirmations,
    ourPoolingAddress,
    convertAmount,
    getTxnData,
  } = baseCryptoData[crypto]

  const txnData = await getTxnData(txid)

  const confirmations = txnData.confirmations

  if (txnData?.outputs?.length) {
    for (const output of txnData.outputs) {
      if (output.address === ourPoolingAddress) {
        logger.error('pooling transaction identified, not crediting', { txid })
        return
      }
    }
  }

  const computedValue = txnData.outputs.reduce((acc, curr) => {
    if (curr.address === address) {
      acc += parseFloat(curr.value) || 0
    }
    return acc
  }, 0)

  const amountUsd = await convertAmount(computedValue)

  if (txnData?.blockhash) {
    await publishLatestTransaction(txnData.blockhash, cryptoType)
  }

  logger.info('processing blockio crypto transaction', {
    data,
    depositType,
    cryptoType,
    amountUsd,
  })

  const wallet = await getBlockioWallet(address, cryptoType)
  if (!wallet) {
    logger.info('no wallet for blockio crypto transaction', { data })
    return
  }

  const user = await getUserById(wallet.userId)
  if (!user) {
    logger.error('No user for blockio txn')
    return
  }

  // TODO could this be moved to the validation step?
  const isEnabled = await checkSystemEnabled(user, 'deposit')
  if (!isEnabled) {
    logger.error(`Deposits are disabled for user ${wallet.userId}`)
    return
  }

  const walletId = wallet.id
  const uniqueId = createUniqueDepositId(walletId, depositType, txid)

  logger.info('Processing blockio crypto transaction 2', {
    walletId,
    uniqueId,
    confirmations,
    address,
    // TODO allow scopedLogger to update context
    user: wallet.userId,
  })

  const currency: Currency = 'usd'
  const payload = {
    depositId: uniqueId,
    user,
    depositType,
    network: cryptoType,
    amount: amountUsd,
    currency,
    externalId: txid,
    confirmations,
    meta: {
      txHash: txid,
      toAddress: address,
    },
    forcedReprocess,
  }

  try {
    const depositId = await startDeposit(payload)
    if (!depositId) {
      logger.error(
        `Blockio Deposit - Could not create mongo deposit record for User ID: ${user.id} and Transaction ID: ${txid}`,
      )
      return
    }

    const precredit =
      crypto === 'btc' && (await checkTxEligiblePrecredit(txnData))

    if (confirmations >= minConfirmations || precredit || forcedReprocess) {
      await addCryptoDeposit({
        user,
        wallet,
        depositId,
        transactionId: txid,
        amount: amountUsd,
        confirmations,
        precredit,
        cryptoType: depositType,
        forcedReprocess,
      })
    } else {
      await updateDepositTransaction({
        _id: depositId,
        status: DepositStatuses.Pending,
        confirmations,
      })
    }
  } catch (error) {
    if (error.toString().includes('Duplicate')) {
      logger.info('found duplicate txn, quitting')
      return
    }
    throw error
  }
}
