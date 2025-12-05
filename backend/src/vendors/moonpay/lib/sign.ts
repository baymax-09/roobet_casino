import crypto from 'crypto'

import { config } from 'src/system'

export function signUrl(originalUrl: string) {
  const key = config.moonpay.secretKey

  const signature = crypto
    .createHmac('sha256', key)
    .update(new URL(originalUrl).search)
    .digest('base64')

  return `${originalUrl}&signature=${encodeURIComponent(signature)}`
}
