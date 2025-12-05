import crypto from 'crypto'

import { config } from 'src/system'

import { handleAllowanceListWebhook, handleCustomListWebhook } from './update'
import {
  type WebhookPayload,
  type WebhookEvent,
  type PayloadValues,
} from '../types'
import { recordSeonUpdate } from '../documents/seonUpdates'

export function verifySignature(
  signature: string,
  payload: WebhookPayload<any>,
): boolean {
  const privateKey = config.seon.apiKey || ''
  const hash = crypto
    .createHmac('sha256', privateKey)
    .update(JSON.stringify(payload))
    .digest('hex')
  return signature === hash
}

/** This allows the fraud to update user accounts through the Seon ACP */
export async function handleWebhookUpdate<T extends WebhookEvent>(
  payload: WebhookPayload<T>,
): Promise<void> {
  const actionMap: { [T in WebhookEvent]: (values: PayloadValues<T>) => any } =
    {
      'lists:blacklist-whitelist': handleAllowanceListWebhook,
      'transaction:status_update': () => null,
      'lists:customlist': handleCustomListWebhook,
    }
  await recordSeonUpdate(payload)
  await actionMap[payload.event](payload.values)
}
