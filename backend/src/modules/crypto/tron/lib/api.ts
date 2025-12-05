import fetch, { Headers } from 'node-fetch'
import * as t from 'io-ts'

import { config } from 'src/system'
import { scopedLogger } from 'src/system/logger'

import { type IOResult } from '../../types'

const trxRpcResponse = <T extends t.Mixed>(resultType: T) =>
  t.type({
    jsonrpc: t.literal('2.0'),
    id: t.literal(1),
    result: resultType,
  })

const TrxPostEndpointsV = t.union([
  t.literal('gettransactionfrompending'),
  t.literal('gettransactioninfobyblocknum'),
  t.literal('getblockbylimitnext'),
  t.literal('getnowblock'),
  t.literal('getblockbynum'),
  t.literal('getblockbylatestnum'),
])
type TrxPostEndpoint = t.TypeOf<typeof TrxPostEndpointsV>

type TrxRpcMethod = 'eth_blockNumber' | 'eth_accounts' | 'eth_gasPrice'

type WrapperResponse<T> = IOResult<T, Error>

const rpcLogger = scopedLogger('trx-rpc-api')
const logger = rpcLogger('trx-rpc-api', { userId: null })

const baseUrl = config.tron.httpProvider

export async function trxRpcApi<T extends t.Mixed>(
  method: TrxRpcMethod,
  params: [] = [],
  responseType: T,
): Promise<WrapperResponse<t.TypeOf<T>>> {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/json')

  const rawJson = JSON.stringify({
    method,
    params,
    jsonrpc: '2.0',
    id: new Date().getTime(),
  })

  const redirect = 'follow'
  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: rawJson,
  }

  try {
    const response = await fetch(`${baseUrl}/jsonrpc`, {
      ...requestOptions,
      redirect,
    })
    const result = await response.text()
    const parsedResult: unknown = JSON.parse(result)
    if (trxRpcResponse(responseType).is(parsedResult)) {
      return {
        success: true,
        result: parsedResult.result,
        error: undefined,
      }
    } else {
      logger.error('Error when making RPC call - missing result', {
        method,
        result,
      })
      return {
        success: false,
        result: undefined,
        error: new Error('missing result'),
      }
    }
  } catch (error) {
    logger.error('Unknown error when making RPC call', {}, error)
    throw new Error(error)
  }
}

export async function trxRestApi<
  T extends Record<string, any>,
  U extends t.Mixed,
>(
  endpoint: TrxPostEndpoint,
  data: T,
  responseType: U,
): Promise<WrapperResponse<t.TypeOf<U>>> {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  const url = `${baseUrl}/wallet/${endpoint}`

  try {
    const response = await fetch(url, {
      method: TrxPostEndpointsV.is(endpoint) ? 'POST' : 'GET',
      headers,
      body: JSON.stringify(data),
    })
    const result: unknown = await response.json()

    if (t.type({ result: responseType }).is({ result })) {
      return {
        success: true,
        result,
        error: undefined,
      }
    } else {
      logger.error('Error when making REST call - missing result', {
        endpoint,
        result,
      })
      return {
        success: false,
        result: undefined,
        error: new Error('missing result'),
      }
    }
  } catch (error) {
    logger.error('Unknown error when making REST call', {}, error)
    return {
      success: false,
      result: undefined,
      error: new Error(error),
    }
  }
}
