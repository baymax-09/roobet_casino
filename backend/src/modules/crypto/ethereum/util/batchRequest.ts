// @ts-expect-error there is no type package for this
import Jsonrpc from 'web3-core-requestmanager/src/jsonrpc'
import {
  type BatchRequest,
  type HttpProvider,
  type WebsocketProvider,
  type IpcProvider,
} from 'web3-core'

interface Result<T> {
  /** version */
  jsonrpc: string
  id: number
  /** hex value - needs formatting */
  result: T
  error: any
}

interface Request<T> {
  method: string
  params: T[]
  // TODO BD someone with more experience with web3 will need to help me correct this
  // eslint-disable-next-line @typescript-eslint/ban-types
  callback: Function
  // TODO BD someone with more experience with web3 will need to help me correct this
  // eslint-disable-next-line @typescript-eslint/ban-types
  format: Function
}

interface RequestManager<T, U> {
  provider: HttpProvider
  providers: {
    WebsocketProvider: [Function: WebsocketProvider]
    HttpProvider: [Function: HttpProvider]
    IpcProvider: [Function: IpcProvider]
  }
  subscriptions: object

  sendBatch: (
    requests: Array<Request<T>>,
    callback: (err: any, results: Array<Result<U>>) => void,
  ) => void
}

interface Web3Batch<T, U> extends BatchRequest {
  requestManager?: RequestManager<T, U>
  requests?: Array<Request<T>>
}

// Weird type hacking here because the Web3 BatchRequest type is wrong
export async function executeBatchAsync<T, U>(
  batch: Web3Batch<T, U>,
): Promise<U[]> {
  const requests = batch.requests
  if (batch.requestManager === undefined || !requests) {
    return []
  }
  const requestManager = batch.requestManager

  return await new Promise(resolve => {
    requestManager.sendBatch(requests, (_, results) => {
      results = results || []
      const response: U[] = requests
        .map((_, index) => {
          return results[index] || {}
        })
        .filter(result => {
          if (result && result.error) {
            return false
          }
          if (!Jsonrpc.isValidResponse(result)) {
            return false
          }
          return true
        })
        .map((result, index) =>
          requests[index].format
            ? requests[index].format(result.result)
            : result.result,
        )

      resolve(response)
    })
  })
}
