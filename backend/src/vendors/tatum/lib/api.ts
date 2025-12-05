import * as t from 'io-ts'
import fetch from 'node-fetch'

import { scopedLogger } from 'src/system/logger'
import { config } from 'src/system/config'
import { type CryptoLowercase } from 'src/modules/crypto/types'

import { ErrorResponseV, type ErrorResponse } from '../types/api'
import { type ValidTatumNetwork } from '../types/network'

const TatumGetEndpointsV = t.union([
  t.literal('/address/balance'),
  t.literal('/transaction'),
  t.literal('/data/utxos'),
])
type TatumGetEndpoint = t.TypeOf<typeof TatumGetEndpointsV>

type APIResponse<T> =
  | {
      success: false
      error: ErrorResponse | Error
      result: undefined
    }
  | {
      success: true
      error: undefined
      result: T
    }

const { apiKey, loggerId } = config.tatum.keys
const baseUrl = 'https://api.tatum.io/v3'
const tatumApiLogger = scopedLogger(loggerId)
const logger = tatumApiLogger('REST API', { userId: null })

const NetworkMap: Record<
  ValidTatumNetwork,
  Extract<CryptoLowercase, 'bitcoin' | 'litecoin' | 'dogecoin'>
> = {
  Bitcoin: 'bitcoin',
  Litecoin: 'litecoin',
  Dogecoin: 'dogecoin',
}

export async function tatumRestApi<T extends t.Mixed>(
  endpoint: TatumGetEndpoint,
  network: ValidTatumNetwork,
  queryParam: string,
  responseType: T,
): Promise<APIResponse<t.TypeOf<T>>> {
  const headers = {
    'x-api-key': apiKey,
  }
  const networkFormatted = NetworkMap[network]
  const url =
    endpoint === '/data/utxos'
      ? `${baseUrl}/${endpoint}?${queryParam}`
      : `${baseUrl}/${networkFormatted}/${endpoint}/${queryParam}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })
    const result: unknown = await response.json()

    if (t.type({ result: responseType }).is({ result })) {
      return {
        success: true,
        result,
        error: undefined,
      }
    } else if (ErrorResponseV.is(result)) {
      logger.error('Error when making REST call - Bad Request', {
        endpoint,
        result,
      })
      return {
        success: false,
        result: undefined,
        error: result,
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
