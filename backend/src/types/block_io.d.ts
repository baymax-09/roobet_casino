declare module 'block_io' {
  /**
   * Available address types for Bitcoin, and Litecoin are P2SH (default), and WITNESS_V0.
   * Dogecoin is limited to P2SH addresses at this time.
   */
  export type AddressType = 'witness_v0' | 'P2SH'
  export type TransactionType = 'sent' | 'received'

  type BlockIoResponse<T> = Promise<{
    status: 'success' | 'fail'
    data: T
  }>

  export type BlockioNetwork = 'BTC' | 'LTC' | 'DOGE'

  export interface BlockioNewBlock {
    /** @todo this is more specific than string */
    network: string
    block_hash: string
    previous_block_hash: string
    /** Block height */
    block_no: number
    /**
     * Number of times this block has been confirmed you will also receive an update at N confirmations:
     * N = 3 (Bitcoin), 10 (Dogecoin), 5 (Litecoin)
     */
    confirmations: 1
    merkle_root: number
    time: number
    nonce: number
    difficulty: string
    txs: string[]
  }

  interface TransactionInput {
    input_no: number
    value: string
    address: string
    type: string
    script: string
    sequence: number
    witness: string[]
    from_output: {
      txid: string
      output_no: number
    }
  }

  interface TransactionOutput {
    output_no: number
    value: string
    address: string
    type:
      | 'nonstandard'
      | 'pubkey'
      | 'pubkeyhash'
      | 'scripthash'
      | 'multisig'
      | 'nulldata'
      | 'witness_v0_keyhash'
      | 'witness_v0_scripthash'
      | 'witness_unknown'
    script: string
  }

  export interface BlockioTransaction {
    network: BlockioNetwork
    address: string
    /** "balance_change": "0.01000000" // net balance change, can be negative */
    balance_change: string
    amount_sent: string
    amount_received: string
    txid: string
    confirmations: number
    /** "is_green": false // legacy, can be ignored */
    is_green?: boolean
    forcedReprocess?: boolean
  }

  export interface BlockioRawTransaction {
    network: BlockioNetwork
    txid: string
    blockhash: string
    confirmations: number
    /** Unix timestamp */
    time: number
    tx_hex: string
    network_fee: string
    size: number
    vsize: number
    version: number
    locktime: number

    inputs: TransactionInput[]
    outputs: TransactionOutput[]
  }

  interface BlockioNotification {
    type: string
    enabled: boolean
    notification_id: string
  }

  interface GetAddressBalanceParams {
    labels?: string
    addresses?: string
  }

  interface GetRawTxnParams {
    txid: string
  }

  interface IsValidAddressParams {
    address: string
  }

  interface GetNewAddressParams {
    label?: string
    address_type?: AddressType
  }

  interface CreateNotificationParams {
    url: string
    type: string
  }

  interface DeleteNotificationParams {
    notification_id: string
  }

  export interface GetNetworkFeeEstimateParams {
    amounts: string
    priority: string
    to_addresses: string
    from_addresses?: string
  }

  interface GetTransactionsParams {
    addresses: string
    type: TransactionType
  }

  export interface PrepareTransactionParams {
    amounts: string
    priority: string // TODO make more specific
    custom_network_fee: string
    to_addresses: string
    from_addresses?: string
  }

  /**
   * We can expand these types if we need to, but these just express the current overlap between the BlockIO API and how
   * we use it.
   */
  export default class BlockIo {
    constructor({ pin: string, api_key: string, options: object })

    get_address_balance(params: GetAddressBalanceParams): BlockIoResponse<{
      available_balance: string
      pending_received_balance: string
    }>

    get_balance(): BlockIoResponse<{
      available_balance: string
      pending_received_balance: string
    }>

    get_raw_transaction(
      params: GetRawTxnParams,
    ): BlockIoResponse<BlockioRawTransaction>

    get_transactions(params: GetTransactionsParams): BlockIoResponse<{
      txs: unknown
    }>

    get_network_fee_estimate(
      params: GetNetworkFeeEstimateParams,
    ): BlockIoResponse<{
      estimated_network_fee: string
    }>

    is_valid_address(params: IsValidAddressParams): BlockIoResponse<{
      is_valid: boolean
    }>

    get_new_address(params: GetNewAddressParams): BlockIoResponse<{
      address: string
    }>

    get_notifications(): BlockIoResponse<BlockioNotification[]>

    create_notification(
      params: CreateNotificationParams,
    ): BlockIoResponse<unknown>

    delete_notification(
      params: DeleteNotificationParams,
    ): BlockIoResponse<unknown>

    prepare_transaction(
      params: PrepareTransactionParams,
    ): BlockIoResponse<unknown>

    /**
     * Accepts the output of prepare_transaction.
     * SDK-only method, does not follow the same response pattern.
     */
    summarize_prepared_transaction(params: {
      data: Awaited<ReturnType<BlockIo['prepare_transaction']>>
    }): Promise<{
      blockio_fee: string
      network: 'BTC' | 'LTC' | 'DOGE'
      network_fee: string
      total_amount_to_send: string
    }>

    /**
     * Accepts the output of prepare_transaction.
     * SDK-only method, does not follow the same response pattern.
     */
    create_and_sign_transaction(params: {
      data: Awaited<ReturnType<BlockIo['prepare_transaction']>>
    }): unknown

    /**
     * Accepts the output of create_and_sign_transaction.
     */
    submit_transaction(params: {
      transaction_data: ReturnType<BlockIo['create_and_sign_transaction']>
    }): BlockIoResponse<{
      network: 'BTC' | 'LTC' | 'DOGE'
      txid: string
    }>
  }
}
