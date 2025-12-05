import axios, { type AxiosRequestConfig } from 'axios'
import crypto from 'crypto'

import { calculateHMACSignature } from './auth'
import { slotegratorLogger } from './logger'

interface SlotegratorAPIConfig {
  baseUrl: string
  merchantId: string
  merchantKey: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bodySerializer?: (body: any) => any
}

interface SlotegratorAPIRequest<D> {
  path: string
  timeout?: number
  method?: 'GET' | 'POST'
  data?: D
  log?: boolean
}

export const makeSlotegratorAPI =
  (config: SlotegratorAPIConfig) =>
  async <T extends object, D extends object = object>({
    path,
    timeout = 3000, // 3 seconds
    method = 'GET',
    data: rawData,
    log = false,
  }: SlotegratorAPIRequest<D>): Promise<T> => {
    const logger = slotegratorLogger('makeSlotegratorAPI', { userId: null })
    const url = `${config.baseUrl}/${path}`
    const _data = rawData ?? {}

    const signHeaders = {
      'X-Merchant-Id': config.merchantId,
      'X-Timestamp': Math.round(new Date().getTime() / 1000),
      'X-Nonce': crypto.randomBytes(16).toString('hex'),
    }

    const { search } = new URL(url)
    const params = new URLSearchParams(search)

    const hmac = calculateHMACSignature(config.merchantKey, {
      ...signHeaders,
      ..._data,
      ...Object.fromEntries(params.entries()),
    })

    const headers = {
      ...signHeaders,
      'X-Sign': hmac,
    }

    // Use custom serializer if supplied.
    const data = config.bodySerializer?.(_data) ?? _data

    const request: AxiosRequestConfig = {
      method,
      url,
      data,
      headers,
      timeout,
    }

    try {
      const response = await axios(request)

      if (log) {
        logger.info(`API request success ${url}`, {
          request,
          response: {
            data: response.data,
            status: response.status,
            headers: response.headers,
            statusText: response.statusText,
          },
        })
      }

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`API request failure ${url}:`, {
          request,
          response: {
            data: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
            statusText: error.response?.statusText,
          },
        })
      }

      throw error
    }
  }
