import {
  type TransactionConfig,
  type TransactionReceipt,
  type Transaction,
} from 'web3-core'

import { type User } from 'src/modules/user/types'
import { type CryptoWithdrawal } from 'src/modules/withdraw/types'

import { type ETHToken, type ERC20Token } from './enums'

interface ReceiptConfirmedResponse {
  isConfirmed: true
  transaction: TransactionReceipt
}

interface ReceiptUnconfirmedResponse {
  isConfirmed: false
  transaction: Transaction | null
}

export enum QueuePriority {
  WITHDRAW_PRIORITY = 1,
  BUMP_PRIORITY = 2,
}

export interface TransactionQueueHook<T> {
  beforeEach: ({
    message,
  }: {
    message: T
  }) => Promise<{ shouldSend: boolean; message: TransactionsQueueMessage }>
  // called after the transaction is sent
  // we know we have a transaction hash but the transaction is not necessarily confirmed
  onSend: ({
    message,
    transactionHash,
    blockSent,
  }: {
    message: T
    transactionHash: string
    blockSent: number
  }) => Promise<void>
  isTransactionConfirmed: ({
    message,
    transactionHash,
  }: {
    message: T
    transactionHash: string
  }) => Promise<ReceiptConfirmedResponse | ReceiptUnconfirmedResponse>
  onReceipt: ({
    message,
    receipt,
  }: {
    message: T
    receipt: TransactionReceipt
  }) => Promise<void>
  shouldBump: ({
    message,
    transaction,
  }: {
    message: T
    transaction: Transaction
  }) => Promise<{
    shouldBump: boolean
    gasPrice: number
  }>
  onError: ({
    message,
    error,
  }: {
    message: T
    error: { code: number; message: string }
  }) => Promise<void>
}

export interface Signer {
  wallet: 'user' | 'main'
  walletIndex?: number
}

export interface Receiver {
  walletAddress: string
  user: User
}

export enum Process {
  POOLING = 'pooling',
  WITHDRAWAL = 'withdrawal',
  APPROVE_ERC20 = 'erc20Approval',
  FUND_ETH = 'fundEth',
}

export interface BaseMessage {
  tx: TransactionConfig
  process: Process
  signer: Signer
  token: ETHToken

  attempts?: number
  transactionHash?: string
}

export interface PoolingMessage extends BaseMessage {
  walletAddress: string
}

export interface WithdrawalMessage extends BaseMessage {
  sendTo: Receiver
  value: number
  fees: {
    userFeePaid: number
    userFeePaidUSD: number
  }
  withdrawal: CryptoWithdrawal
}

export interface ApproveERC20Message extends BaseMessage {
  walletAddress: string
  /** overwrite base token type */
  token: ERC20Token
}

export interface FundETHMessage extends BaseMessage {
  walletAddress: string
  /** overwrite base token type */
  token: ERC20Token
}

export type TransactionsQueueMessage =
  | PoolingMessage
  | WithdrawalMessage
  | ApproveERC20Message
  | FundETHMessage

export interface ConfirmationsQueueMessage {
  message: TransactionsQueueMessage
  transactionHash: string
}
