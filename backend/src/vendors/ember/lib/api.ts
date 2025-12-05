import axios from 'axios'
import crypto from 'crypto'

import { type BaseEmberAccountLink } from '../documents/ember_accounts'
import { generateRequestSignature } from './encryptionHelper'
import { emberLogger } from './logger'

interface ConfirmLinkFailure {
  success: false
  detail: string
}
interface ConfirmLinkSuccess {
  success: true
}
type ConfirmLinkResponse = ConfirmLinkFailure | ConfirmLinkSuccess

export const confirmEmberAccountLink = async ({
  userId,
  emberUserId,
}: BaseEmberAccountLink): Promise<ConfirmLinkResponse> => {
  const logger = emberLogger('confirmEmberAccountLink', { userId })
  const body = { roobetUserId: userId, emberUserId }
  const jsonBody = JSON.stringify(body)
  const randomIv = crypto.randomBytes(8).toString('hex')
  const requestSignature = generateRequestSignature(jsonBody, randomIv)

  try {
    await axios('https://api.emberfund.io/roobet/users', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'x-ember-signature': requestSignature,
      },
      data: body,
    })
    return { success: true }
  } catch (error) {
    logger.error('Failed to confirm link', { detail: error.response })
    return { success: false, detail: error.response.data.errorMessage }
  }
}
