import {
  type TxResponse,
  type Transaction,
  type Payment,
  type AccountDelete,
} from 'xrpl'

export type RippleTransaction = TxResponse<Transaction>
export const isPaymentTransaction = (tx: any): tx is Payment =>
  tx.TransactionType === 'Payment'
export const isAccountDeleteTransaction = (tx: any): tx is AccountDelete =>
  tx.TransactionType === 'AccountDelete'

// There are many types, but these are the ones we care about
export type RippleTransactionTypes = 'Payment'

export interface RippleQuickNodeTransaction {
  /** The unique address of the account that initiated the transaction */
  Account: string
  Amount: string
  /** recipient */
  Destination: string
  /** fee is in drops */
  Fee: string
  Flags: number
  LastLedgerSequence: number
  Memos: unknown[]
  /** sequence number (transactionCount) of the sender */
  Sequence: number
  SigningPubKey: string
  /** The type of transaction. Valid transaction types include: Payment, OfferCreate, TrustSet, and many others */
  TransactionType: RippleTransactionTypes
  TxnSignature: string
  /** transaction ID */
  hash: string
  ledger_index: number
  date: Date
  /** whether or not the transaction is on a validated ledger, and, thus, if it is permanent */
  validated: boolean
  /** status of the request -- NOT the status of the transaction */
  status: string

  metadata: {
    AffectedNodes: Array<{
      ModifiedNode: {
        /** The content fields of the ledger object after applying any changes from this transaction */
        FinalFields: {
          Account: string
          Balance: string
          Flags: number
          OwnerCount: number
          Sequence: number
        }
        LedgerEntryType: string
        LedgerIndex: string
        /** The previous values for all fields of the object that were changed as a result of this transaction */
        PreviousFields: {
          Balance: string
          Sequence: number
        }
        PreviousTxnID: string
        PreviousTxnLgrSeq: number
      }
    }>
    /** The transaction's position within the ledger that included it */
    TransactionIndex: number
    /** A result code indicating whether the transaction succeeded or how it failed */
    TransactionResult: string
    /** The currency Amount actually received by the Destination account -- in Drops */
    delivered_amount: string
  }
}
