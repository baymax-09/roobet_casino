import * as t from 'io-ts'

export const ContractTypeV = t.union([
  t.literal('Transfer'),
  t.literal('AccountCreateContract'),
  t.literal('TransferContract'),
  t.literal('TransferAssetContract'),
  t.literal('VoteAssetContract'),
  t.literal('VoteWitnessContract'),
  t.literal('WitnessCreateContract'),
  t.literal('AssetIssueContract'),
  t.literal('WitnessUpdateContract'),
  t.literal('ParticipateAssetIssueContract'),
  t.literal('AccountUpdateContract'),
  t.literal('FreezeBalanceContract'),
  t.literal('UnfreezeBalanceContract'),
  t.literal('WithdrawBalanceContract'),
  t.literal('UnfreezeAssetContract'),
  t.literal('UpdateAssetContract'),
  t.literal('ProposalCreateContract'),
  t.literal('ProposalApproveContract'),
  t.literal('ProposalDeleteContract'),
  t.literal('SetAccountIdContract'),
  t.literal('CustomContract'),
  t.literal('CreateSmartContract'),
  t.literal('TriggerSmartContract'),
  t.literal('GetContract'),
  t.literal('UpdateSettingContract'),
  t.literal('ExchangeCreateContract'),
  t.literal('ExchangeInjectContract'),
  t.literal('ExchangeWithdrawContract'),
  t.literal('ExchangeTransactionContract'),
  t.literal('UpdateEnergyLimitContract'),
  t.literal('AccountPermissionUpdateContract'),
  t.literal('ClearABIContract'),
  t.literal('UpdateBrokerageContract'),
  t.literal('ShieldedTransferContract'),
  t.literal('MarketSellAssetContract'),
  t.literal('MarketCancelOrderContract'),
  t.literal('FreezeBalanceV2Contract'),
  t.literal('UnfreezeBalanceV2Contract'),
  t.literal('WithdrawExpireUnfreezeContract'),
  t.literal('DelegateResourceContract'),
  t.literal('UnDelegateResourceContract'),
  t.literal('CancelAllUnfreezeV2Contract'),
])

export const TransferContractV = t.type({
  type: t.literal('TransferContract'),
  parameter: t.type({
    /** an object whose fields and values vary depending on transaction type */
    value: t.type({
      owner_address: t.string,
      to_address: t.string,
      amount: t.number,
    }),
    /** contract protocol reference url */
    type_url: t.string,
  }),
})

export const TriggerSmartContractV = t.type({
  type: t.literal('TriggerSmartContract'),
  parameter: t.type({
    /** an object whose fields and values vary depending on transaction type */
    value: t.type({
      owner_address: t.string,
      contract_address: t.string,
      data: t.string,
    }),
    /** contract protocol reference url */
    type_url: t.string,
  }),
})

export const ContractV = t.intersection([
  t.union([
    t.type({
      type: ContractTypeV,
      parameter: t.type({
        /** an object whose fields and values vary depending on transaction type */
        value: t.any,
        /** contract protocol reference url */
        type_url: t.string,
      }),
    }),
    TransferContractV,
    TriggerSmartContractV,
  ]),
  t.partial({
    /** type byte in Java */
    provider: t.number,
    /** type byte in Java */
    ContractName: t.number,
    /** type int32 in Java */
    Permission_id: t.number,
  }),
])

export const ContractResultV = t.union([
  t.literal('DEFAULT'),
  t.literal('SUCCESS'),
  t.literal('REVERT'),
  t.literal('BAD_JUMP_DESTINATION'),
  t.literal('OUT_OF_MEMORY'),
  t.literal('PRECOMPILED_CONTRACT'),
  t.literal('STACK_TOO_SMALL'),
  t.literal('STACK_TOO_LARGE'),
  t.literal('ILLEGAL_OPERATION'),
  t.literal('STACK_OVERFLOW'),
  t.literal('OUT_OF_ENERGY'),
  t.literal('OUT_OF_TIME'),
  t.literal('JVM_STACK_OVER_FLOW'),
  t.literal('UNKNOWN'),
  t.literal('TRANSFER_FAILED'),
  t.literal('INVALID_CODE'),
])

export const TransactionResultV = t.intersection([
  t.type({
    contractRet: ContractResultV,
  }),
  t.partial({
    // this is mispelled in the java-tron repo -- not sure
    ret: t.union([t.literal('SUCESS'), t.literal('FAILED')]),
    fee: t.number,
    assetIssueID: t.string,
    withdraw_amount: t.number,
    unfreeze_amount: t.number,
    exchange_received_amount: t.number,
    exchange_inject_another_amount: t.number,
    exchange_withdraw_another_amount: t.number,
    exchange_id: t.number,
    shielded_transaction_fee: t.number,
    /** type byte in Java */
    orderId: t.number,
    // in java-tron -- repeated MarketOrderDetail orderDetails = 26;
    withdraw_expire_amount: t.number,
    cancel_unfreezeV2_amount: t.record(t.string, t.number),
  }),
])

export const BlockTransactionV = t.intersection([
  t.type({
    txID: t.string,
    ret: t.array(TransactionResultV),
    signature: t.array(t.string),
    raw_data: t.intersection([
      t.type({ contract: t.array(ContractV) }),
      t.partial({
        ref_block_bytes: t.string,
        ref_block_hash: t.string,
        expiration: t.number,
        timestamp: t.number,
        data: t.string,
        fee_limit: t.number,
      }),
    ]),
    raw_data_hex: t.string,
  }),
  t.partial({
    visible: t.boolean,
  }),
])

export const BlockInfoV = t.intersection([
  t.type({
    blockID: t.string,
    block_header: t.type({
      raw_data: t.intersection([
        t.type({
          txTrieRoot: t.string,
          witness_address: t.string,
          parentHash: t.string,
        }),
        t.partial({
          number: t.number,
          timestamp: t.number,
          version: t.number,
        }),
      ]),
      witness_signature: t.string,
    }),
  }),
  t.partial({
    transactions: t.array(BlockTransactionV),
  }),
])
export const BlockInfosV = t.array(BlockInfoV)
