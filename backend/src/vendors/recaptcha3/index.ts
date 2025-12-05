import request from 'request-promise'

import { config } from 'src/system'
import { APIValidationError } from 'src/util/errors'
import { recaptchaLogger } from './lib/logger'

const recaptcha_uri = 'https://www.google.com/recaptcha/api/siteverify'

// docs: https://developers.google.com/recaptcha/docs/v3

const logger = recaptchaLogger('verifyRecaptchaSignup', { userId: null })

export async function verifyRecaptchaSignup(response: string, isV3 = false) {
  const secret = isV3 ? config.google.recaptcha.v3 : config.google.recaptcha.v2

  if (!response) {
    logger.error('reCAPTCHA response is empty.')
    return false
  }

  try {
    const parsedBody = await request({
      method: 'POST',
      uri: recaptcha_uri,
      json: true,
      qs: { secret, response },
    })
    logger.info('reCAPTCHA response', { parsedBody })
    if (!parsedBody.success) {
      throw new APIValidationError('auth__bad_recaptcha')
    }
    if (isV3 && parsedBody.score < 0.7) {
      return false
    }
    return parsedBody.success
  } catch {
    throw new APIValidationError('auth__bad_recaptcha')
  }
}
