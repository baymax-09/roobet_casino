import * as t from 'io-ts'

import { type BlockTransactionV, BlockInfoV } from 'src/types/tronweb/controls'

export enum TransactionType {
  Transfer = 'TransferContract',
  TRC20 = 'TriggerSmartContract',
  Freeze = 'FreezeBalanceV2Contract',
  Unfreeze = 'UnfreezeBalanceV2Contract',
}

export const BlockInfosV = t.array(BlockInfoV)
export type BlockInfo = t.TypeOf<typeof BlockInfoV>

export type Transaction = t.TypeOf<typeof BlockTransactionV>

export const AccountResourceV = t.type({
  freeNetLimit: t.number,
  assetNetUsed: t.array(t.type({ key: t.string, value: t.number })),
  assetNetLimit: t.array(t.type({ key: t.string, value: t.number })),
  TotalNetLimit: t.number,
  TotalNetWeight: t.number,
  TotalEnergyLimit: t.number,
  TotalEnergyWeight: t.number,
})

export type AccountResource = t.TypeOf<typeof AccountResourceV>

const LogV = t.type({
  address: t.string,
  data: t.string,
  topics: t.array(t.string),
})

export type Log = t.TypeOf<typeof LogV>

const InternalTransactionV = t.type({
  caller_address: t.string,
  note: t.string,
  transferTo_address: t.string,
  hash: t.string,
  callValueInfo: t.array(t.type({ callValue: t.number })),
})

export type InternalTransaction = t.TypeOf<typeof InternalTransactionV>

const ReceiptV = t.intersection([
  t.type({
    net_fee: t.number,
    energy_fee: t.number,
    energy_usage: t.number,
    energy_usage_total: t.number,
  }),
  t.partial({ result: t.literal('SUCCESS') }),
])

export type Receipt = t.TypeOf<typeof ReceiptV>

// lacks a value field
export const TransactionInfoV = t.intersection([
  t.type({
    id: t.string,
    fee: t.number,
    blockNumber: t.number,
    blockTimeStamp: t.number,
    contractResult: t.array(t.string),
    contract_address: t.string,
    receipt: ReceiptV,
    log: t.array(LogV),
    internal_transactions: t.array(InternalTransactionV),
  }),
  t.partial({
    result: t.literal('FAILED'),
    resMessage: t.string,
  }),
])
export const TransactionInfosV = t.array(TransactionInfoV)
export type TransactionInfo = t.TypeOf<typeof TransactionInfoV>

export const OutboundTransactionV = t.type({
  to_address: t.string,
  owner_address: t.string,
  /** amount in SUN */
  amount: t.number,
  visible: t.literal(true),
})
export type OutboundTransaction = t.TypeOf<typeof OutboundTransactionV>
