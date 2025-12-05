import axios, { type AxiosRequestConfig } from 'axios'
import i18n from 'i18next'

import { env } from 'common/constants'
import { events } from 'common/core/events'
import { logEvent } from 'common/util/logger'

import { exponentialDelay } from './math'

interface APIErrorResponse {
  response: {
    status: string
    data: string
  }
  message: string
  code?: string
}

export const isApiError = (value: any): value is APIErrorResponse => {
  return (
    typeof value === 'object' &&
    (('response' in value &&
      typeof value.response === 'object' &&
      'data' in value.response &&
      typeof value.response.data === 'string') ||
      ('message' in value && typeof value.message === 'string'))
  )
}

const nonRetryCodes = [
  1001, // Not enough balance
]

export const api = axios.create({
  timeout: 1000 * 10 * 10, // need a higher timeout for ACP at least
  baseURL: env.API_URL,
  withCredentials: true,
  headers: {
    'accept-language': global.window
      ? localStorage.getItem('i18nextLng') ?? 'en'
      : 'en',
  },
})

api.interceptors.request.use(
  (config: AxiosRequestConfig & { retries?: { retryCount?: number } }) => {
    if (config.retries) {
      config.retries.retryCount = config.retries.retryCount || 0
    }
    config.headers = {
      ...config.headers,
      'accept-language': global.window
        ? localStorage.getItem('i18nextLng') ?? 'en'
        : 'en',
    }
    return config
  },
  (_) /* err */ => {
    // intentionally left empty, but unsure why
  },
)

api.interceptors.response.use(
  response => {
    return response.data
  },
  function (err) {
    const config = err.config
    const retries = config.retries
    // Do not retry if we match a certain error code (e.g. not enough balance)
    const shouldRetry =
      retries &&
      retries.retryCount < retries.maxRetries &&
      !(
        typeof err?.response?.data?.code !== 'undefined' &&
        nonRetryCodes.includes(err.response.data.code)
      )

    if (err?.response?.data) {
      err.message = err.response.data
      events.emit('api:error', err.response.data)
    }

    if (shouldRetry) {
      config.retries.retryCount++
      return new Promise((resolve, reject) =>
        setTimeout(
          () => api(config).then(resolve, reject),
          exponentialDelay(config.retries.retryCount),
        ),
      )
    }

    if (err?.response?.data?.code) {
      return Promise.reject({
        response: {
          status: err.response.status,
          data: err.response.data.message,
        },

        ...err.response.data,
      })
    }

    if (!err?.response?.data) {
      if (err?.response?.status === 429) {
        return Promise.reject({
          response: {
            data: i18n.t('generic.slowDown'),
          },
        })
      }

      logEvent(
        'API Error',
        { method: err.config.method, url: err.config.url },
        'error',
      )

      return Promise.reject({
        error: err,

        config: {
          method: err.config.method,
          url: err.config.url,
        },

        response: {
          data: 'Please try again later',
        },
      })
    }

    return Promise.reject(err)
  },
)
