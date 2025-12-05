import crypto from 'crypto'

import { config } from 'src/system'
import { emberLogger } from './logger'

const encryptionKey = config.ember.aes_key
const ENCRYPTION_ALGO = 'aes-256-cbc'

export const encrypt = (data: string, iv: string) => {
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGO,
    Buffer.from(encryptionKey),
    iv,
  )
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return encrypted
}

export const decrypt = (data: string, iv: string) => {
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGO,
    Buffer.from(encryptionKey),
    iv,
  )
  let decrypted = decipher.update(data, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export const generateRequestSignature = (data: string, iv: string) => {
  const logger = emberLogger('generateRequestSignature', { userId: null })
  try {
    const encrypted = encrypt(data, iv)
    return `${encrypted}:${iv}`
  } catch (error) {
    logger.error('Error generating request signature', {
      data,
      iv,
      error: { message: error.message, code: error.code },
    })
  }
}

export const verifyRequest = (
  request: {
    ember_user_id: string
    amount_usd: number
  },
  signature: string,
  iv: string,
): boolean => {
  const logger = emberLogger('verifyRequest', { userId: null })
  let passed = false
  let calculatedSignature = null
  try {
    calculatedSignature = generateRequestSignature(JSON.stringify(request), iv)
    passed = signature === calculatedSignature
  } catch (error) {
    logger.error('Error verifying request signature', { error })
  }
  if (!passed) {
    logger.debug('Invalid request signature', {
      request,
      signature,
      calculatedSignature,
    })
  }
  return passed
}
