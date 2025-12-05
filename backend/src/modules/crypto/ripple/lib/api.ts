import type {
  AccountTxResponse,
  Client,
  FeeRequest,
  FeeResponse,
  LedgerResponse,
  ServerInfoRequest,
  ServerInfoResponse,
  Transaction,
  TxResponse,
  Wallet,
} from 'xrpl'

import { RippleAPIError } from '../types'

export async function getAccountTx(
  client: Client,
  accountAddr: string,
  ledger_min: number,
  ledger_max: number,
): Promise<AccountTxResponse> {
  try {
    return await client.request({
      command: 'account_tx',
      account: accountAddr,
      ledger_index_min: ledger_min,
      ledger_index_max: ledger_max,
      binary: false,
    })
  } catch (error) {
    throw new RippleAPIError(error.message)
  }
}

export async function getLedgerFromIndex(
  client: Client,
  ledgerIndex: number,
): Promise<LedgerResponse> {
  try {
    return await client.request({
      command: 'ledger',
      ledger_index: ledgerIndex,
    })
  } catch (error) {
    throw new RippleAPIError(error.message)
  }
}

export async function getRippleFee(client: Client): Promise<number> {
  const estimate_fee_query: FeeRequest = {
    command: 'fee',
    id: 'EstimateFee',
  }
  const query_server_state: ServerInfoRequest = {
    command: 'server_info',
  }

  const responseFee: FeeResponse = await client.request(estimate_fee_query)
  const serverState: ServerInfoResponse =
    await client.request(query_server_state)
  return (
    parseInt(responseFee.result.drops.base_fee) *
    (serverState.result.info.load_factor ?? 1)
  )
}

export async function getTransaction(
  client: Client,
  transactionHash: string,
): Promise<TxResponse<Transaction>> {
  try {
    return await client.request({
      command: 'tx',
      transaction: transactionHash,
    })
  } catch (error) {
    throw new RippleAPIError(error.message)
  }
}

export async function submitTransaction(
  client: Client,
  transaction: Transaction,
  opts: { wallet: Wallet },
): Promise<string> {
  try {
    const { result } = await client.submit(transaction, opts)
    if (result.tx_json.hash) return result.tx_json.hash
    throw new RippleAPIError('Transaction hash not found.')
  } catch (error) {
    throw new RippleAPIError(error.message)
  }
}
