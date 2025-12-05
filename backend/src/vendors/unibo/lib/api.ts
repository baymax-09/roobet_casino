import axios, { type Method } from 'axios'
import fetch from 'node-fetch'
import { config } from 'src/system'
import { scopedLogger } from 'src/system/logger'

const uniboRequestLogger = scopedLogger('UniboOptIn')

interface UniboAuthRequest {
  grant_type?: string
  username: string
  password: string
  scope?: string
  clientId?: string
  client_secret?: string
}

interface AuthTokenSuccessResponse {
  access_token: string
  token_type: string
}

interface AuthTokenFailureResponse {
  detail: string
  errors: Record<string, string | number>
  model_config: Record<string, unknown>
}

interface ValidationErrorDetail {
  loc: Array<string | number>
  msg: string
  type: string
}
interface AuthTokenValidationResponse {
  detail: ValidationErrorDetail[]
}
interface RetrieveTokenSuccess {
  success: true
  data: AuthTokenSuccessResponse
}
interface RetrieveTokenFailure {
  success: false
  data: AuthTokenValidationResponse | AuthTokenFailureResponse | string
}

type RetrieveTokenResponse = RetrieveTokenSuccess | RetrieveTokenFailure

const retrieveAuthToken = async (): Promise<RetrieveTokenResponse> => {
  const logger = uniboRequestLogger('retrieveAuthToken', { userId: null })
  const requestBody: UniboAuthRequest = {
    username: config.unibo.username,
    password: config.unibo.password,
  }
  const body = new URLSearchParams({ ...requestBody }).toString()

  try {
    const response = await axios(`${config.unibo.baseUrl}/api/v1/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: body,
    })
    if (response.status !== 200) {
      throw new Error('request failed', response.data)
    } else {
      return {
        success: true,
        data: response.data,
      }
    }
  } catch (error) {
    logger.error('Failed to retrieve auth token', {
      errorMessage: error.message,
      errorResponse: error.response.data.detail,
    })
    return {
      success: false,
      data:
        error.response.data.detail ||
        'Unknown error while retrieving auth token',
    }
  }
}

interface UniboRequestConfig {
  path: string
  method: Method
}

// Current request only requires this endpoint but I forsee requests to
// expand the API in order to manage campaigns.
const UniboRequestConfigs: Record<string, UniboRequestConfig> = {
  optInPlayer: {
    path: `/api/v1/campaigns/opt_in_player?tenant_name=${config.unibo.tenant}`,
    method: 'POST',
  },
}
type UniboAPIAction = keyof typeof UniboRequestConfigs

export interface UniboRequestParams {
  action: UniboAPIAction
  data: Record<string, string>
}

export const makeUniboRequest = async ({
  action,
  data,
}: UniboRequestParams) => {
  const logger = uniboRequestLogger('makeUniboRequest', { userId: null })
  const { path, method } = UniboRequestConfigs[action]
  const baseURL = `${config.unibo.baseUrl}${path}`
  const preciseURL =
    method === 'GET'
      ? `${baseURL}${new URLSearchParams(data).toString()}`
      : baseURL

  const tokenResponse = await retrieveAuthToken()

  if (!tokenResponse.success) {
    return { success: false, data: 'Failed to retrieve auth token' }
  }
  const headers = {
    Authorization: `Bearer ${tokenResponse.data.access_token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  const fetchConfig = {
    method,
    headers,
    body: method === 'POST' ? JSON.stringify(data) : undefined,
  }
  try {
    const fetchResponse = await fetch(preciseURL, fetchConfig)
    const responseData = await fetchResponse.json()

    if (fetchResponse.status !== 200) {
      logger.error('opt-in request failed', {
        status: fetchResponse.status,
        errorResponse: responseData,
      })
      return { success: false, data: responseData }
    }
    return { success: true, data: responseData }
  } catch (error) {
    logger.error('unknown opt-in error', error.message)
    return { success: false, data: 'Unknown error making opt-in request' }
  }
}
