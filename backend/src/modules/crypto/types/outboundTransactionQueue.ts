import { type Options } from 'amqplib'

import { type CryptoWithdrawal } from 'src/modules/withdraw/types'
import { type CryptoNetwork, type CryptoSymbol } from 'src/modules/crypto/types'

export enum OutboundQueuePriority {
  WITHDRAW_PRIORITY = 1,
  BUMP_PRIORITY = 2,
}

// What wallet is signing the transaction
type Signer = 'user' | 'main' | 'pool'

export const Processes = [
  'withdrawal',
  /** fund user wallet in order to authorize pooling wallet */
  'fund',
  /** authorize pooling wallet to move ERC20-type tokens from user wallet */
  'approval',
  /** transfer tokens from user wallet to pooling wallet */
  'pooling',
] as const
export type Process = (typeof Processes)[number]

export interface BaseMessage<T> {
  tx: T
  process: Process
  sendTo: {
    walletAddress: string
  }
  /** value of the tokens being transacted in USD */
  value: number
  token: CryptoSymbol
  network: CryptoNetwork

  attempts?: number
  transactionHash?: string
}

export interface WithdrawMessage<T> extends BaseMessage<T> {
  process: Extract<Process, 'withdrawal'>
  withdrawal: CryptoWithdrawal
  fees: {
    userFeePaid: number
    userFeePaidUSD: number
  }
}

export interface PoolingMessage<T> extends BaseMessage<T> {
  process: Exclude<Process, 'withdrawal'>
  signer: {
    wallet: Signer
    walletIndex: number
    walletAddress: string
  }
}

// default to unknown because the queue/consumer does not care about the transaction type
export type CryptoOutboundTransactionQueueMessage<T = any> =
  | WithdrawMessage<T>
  | PoolingMessage<T>

export type CryptoOutboundConfirmationQueueMessage =
  CryptoOutboundTransactionQueueMessage & { transactionHash: string }
export const isConfirmationMessage = (
  message:
    | CryptoOutboundTransactionQueueMessage
    | CryptoOutboundConfirmationQueueMessage,
): message is CryptoOutboundConfirmationQueueMessage =>
  'transactionHash' in message

export interface OutboundTransactionQueueHook<
  T extends CryptoOutboundTransactionQueueMessage,
  U,
  V,
> {
  validationCheck: ({ message }: { message: T }) => boolean
  beforeEach: ({ message }: { message: T }) => Promise<{
    shouldSend: boolean
    message: T
  }>
  sendTransaction: ({
    message,
    transaction,
  }: {
    message: T
    transaction: U
  }) => Promise<{ transactionHash: string; blockSent: number | undefined }>
  onSend: ({
    message,
    transactionHash,
    blockSent,
  }: {
    message: T
    transactionHash: string
    blockSent: number | undefined
  }) => Promise<void>
  /** ------ */
  // check pending transaction pool
  isPublishedTransaction: ({ message }: { message: T }) => Promise<boolean>
  // confirm the transaction
  isTransactionConfirmed: ({
    message,
    transactionHash,
  }: {
    message: T
    transactionHash: string
  }) => Promise<{ isConfirmed: boolean; transaction: V | null }>
  // if the top two hooks return false or NO TRANSACTION, then the transaction has been dropped
  /** ------ */
  onReceipt: ({ message, receipt }: { message: T; receipt: V }) => Promise<void>
  bumpCheck: ({
    message,
    transactionHash,
  }: {
    message: T
    transactionHash: string
  }) => Promise<{ shouldBump: boolean; message: T } | undefined>
  publishOutboundMessage: (
    message: T,
    messageOptions?: Options.Publish,
  ) => Promise<void>
  publishConfirmMessage: (
    message: T,
    messageOptions?: Options.Publish,
  ) => Promise<void>
  onError: ({
    message,
    error,
  }: {
    message: T
    error: { code: number; message: string }
  }) => Promise<{ shouldRetry: boolean }>
}
