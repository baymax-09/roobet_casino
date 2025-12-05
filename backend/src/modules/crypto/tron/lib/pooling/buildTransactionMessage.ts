import { config } from 'src/system'
import { type PoolingMessage } from 'src/modules/crypto/types'

import {
  type TRC20Token,
  type TronAddressBase58,
  type TronWallet,
  type Transaction,
} from '../../types'
import { getProvider } from '../../util/getProvider'
import {
  type ApprovalTransactionInfo,
  type TRC20PoolingTransactionInfo,
} from '../../types/pool'
import {
  derivePoolingWallet,
  derivePrimaryWallet,
  getTrxBalance,
} from '../wallet'

const MAX_UINT =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

interface BuildFundMessageArgs {
  token: TRC20Token
  userWalletAddress: TronAddressBase58
  poolingWalletAddress: TronAddressBase58
  amountInSun: number
  amountInUSD: number
}

interface BuildApprovalMessageArgs {
  token: TRC20Token
  userWallet: TronWallet
  walletToApprove: TronAddressBase58
}

interface BuildPoolMessageArgs {
  userWallet: TronWallet
  poolingWalletAddress: TronAddressBase58
  amountInSun: number
  amountInUSD: number
}

interface BuildTRC20PoolMessageArgs {
  token: TRC20Token
  userWalletAddress: TronAddressBase58
  poolingWalletAddress: TronAddressBase58
  amountInTokens: number
  amountInUSD: number
}

export async function buildFundingMessage({
  token,
  userWalletAddress,
  poolingWalletAddress,
  amountInSun,
  amountInUSD,
}: BuildFundMessageArgs): Promise<PoolingMessage<Transaction>> {
  const tronweb = getProvider()
  const tx = await tronweb.transactionBuilder.sendTrx(
    userWalletAddress,
    amountInSun,
    poolingWalletAddress,
    0,
  )

  return {
    tx,
    process: 'fund',
    signer: {
      wallet: 'pool',
      walletAddress: poolingWalletAddress,
      walletIndex: config.tron.pooling.poolingIndex,
    },
    sendTo: {
      walletAddress: userWalletAddress,
    },
    token,
    network: 'Tron',
    value: amountInUSD,
  }
}

export function buildApprovalMessage({
  token,
  userWallet,
  walletToApprove,
}: BuildApprovalMessageArgs): PoolingMessage<ApprovalTransactionInfo> {
  return {
    tx: {
      walletToApprove,
      amountToApprove: MAX_UINT,
    },
    process: 'approval',
    signer: {
      wallet: 'user',
      walletIndex: userWallet.nonce,
      walletAddress: userWallet.address,
    },
    sendTo: {
      walletAddress: walletToApprove,
    },
    token,
    network: 'Tron',
    value: 0,
  }
}

export function buildTRC20PoolingMessage({
  token,
  userWalletAddress,
  poolingWalletAddress,
  amountInTokens,
  amountInUSD,
}: BuildTRC20PoolMessageArgs): PoolingMessage<TRC20PoolingTransactionInfo> {
  return {
    tx: {
      from: userWalletAddress,
      amount: amountInTokens,
      to: poolingWalletAddress,
    },
    token,
    process: 'pooling',
    signer: {
      wallet: 'pool',
      walletAddress: poolingWalletAddress,
      walletIndex: config.tron.pooling.poolingIndex,
    },
    sendTo: {
      walletAddress: poolingWalletAddress,
    },
    network: 'Tron',
    value: amountInUSD,
  }
}

export async function buildTrxPoolingMessage({
  poolingWalletAddress,
  userWallet,
  amountInSun,
  amountInUSD,
}: BuildPoolMessageArgs): Promise<PoolingMessage<Transaction>> {
  const tronweb = getProvider()
  const tx = await tronweb.transactionBuilder.sendTrx(
    poolingWalletAddress,
    amountInSun,
    userWallet.address,
    0,
  )

  return {
    tx,
    token: 'trx',
    process: 'pooling',
    network: 'Tron',
    signer: {
      wallet: 'user',
      walletAddress: userWallet.address,
      walletIndex: userWallet.nonce,
    },
    sendTo: {
      walletAddress: poolingWalletAddress,
    },
    value: amountInUSD,
  }
}

/** sends all accumulated funds in pooling wallet to the main wallet */
export async function buildFinalTrxPoolingMessage(): Promise<
  PoolingMessage<Transaction>
> {
  // sender
  const { address: poolingAddress } = derivePoolingWallet()
  // recipient
  const { address: mainAddress } = derivePrimaryWallet()

  const tronWeb = getProvider()
  const totalBalance = await getTrxBalance(poolingAddress)
  const balanceInSun = parseInt(tronWeb.toSun(totalBalance.trx))
  const tx = await tronWeb.transactionBuilder.sendTrx(
    mainAddress,
    balanceInSun,
    poolingAddress,
    0,
  )
  return {
    tx,
    token: 'trx',
    process: 'pooling',
    network: 'Tron',
    signer: {
      wallet: 'pool',
      walletAddress: poolingAddress,
      walletIndex: config.tron.pooling.poolingIndex,
    },
    sendTo: {
      walletAddress: mainAddress,
    },
    value: balanceInSun,
  }
}
