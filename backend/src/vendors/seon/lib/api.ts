import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

import { config } from 'src/system'

import { recordSeonTransaction, updateTransactionLabel } from '../documents'
import {
  type Action,
  type Label,
  type SeonRequestConfig,
  type SeonRequest,
  type SeonResponse,
} from '../types'
import { safelyRecordSeonHistory } from '../documents/seonHistory'
import { seonLogger } from './logger'

const api = axios.create({
  baseURL: config.seon.baseUrl,
  headers: {
    'X-API-KEY': config.seon.apiKey,
    'Content-Type': 'application/json',
  },
  timeout: 12000,
})

// This version will need to be updated whenever Seon updates their API
const defaultConfigParam = (version: string) => ({
  version: `v${version}`,
  include: 'flags,history,id',
  timeout: 2000,
})

const defaultConfig: SeonRequestConfig = {
  ip: defaultConfigParam('1'),
  email: defaultConfigParam('2'),
  phone: defaultConfigParam('1'),

  email_api: true,
  phone_api: true,
  ip_api: true,
  device_fingerprinting: true,
}

const configOverrides: Readonly<
  Partial<Record<Action, Readonly<Record<'email_api' | 'phone_api', boolean>>>>
> = {
  user_signup: {
    email_api: true,
    phone_api: false,
  },
  kyc_level1_save: {
    email_api: true,
    phone_api: false,
  },
  crypto_deposit: {
    email_api: false,
    phone_api: false,
  },
  cash_deposit: {
    email_api: false,
    phone_api: false,
  },
}

export async function fraudRequest(
  actionType: Action,
  payload: Partial<SeonRequest>,
): Promise<SeonResponse | null> {
  let config = defaultConfig
  if (configOverrides[actionType]) {
    config = { ...defaultConfig, ...configOverrides[actionType] }
  }

  const postData: SeonRequest = {
    config,
    action_type: actionType,
    ...payload,
  }
  try {
    const response = await api.post<SeonResponse>('/fraud-api/v2', postData)

    if (!response?.data) {
      return null
    }

    const responseData = response.data.data

    if (responseData.id && payload.user_id) {
      const seonTransaction = {
        userId: payload.user_id,
        type: actionType,
        seonId: responseData.id,
        internalId: payload.transaction_id || uuidv4(),
      }

      await recordSeonTransaction(seonTransaction)

      await safelyRecordSeonHistory({
        user_id: payload.user_id,
        seon_transaction_id: responseData.id,
        ...responseData,
      })
    }

    return response.data
  } catch (error) {
    seonLogger('fraudRequest', { userId: payload.user_id ?? null }).error(
      `[seon] - failed fraud api request for user: ${payload.user_id}`,
      {},
      error,
    )
  }
  return null
}

export async function fraudFeedback(transactionId: string, label: Label) {
  const putData = {
    label,
  }

  try {
    const response = await api.put<unknown>(
      `/fraud-api/label/v1/${transactionId}`,
      putData,
    )

    await updateTransactionLabel(transactionId, label)

    return response.data
  } catch (error) {
    seonLogger('fraudFeedback', { userId: null }).error(
      'Failed to process fraud feedback',
      { transactionId },
      error,
    )
  }
}
