import express from 'express'

import { APIValidationError } from 'src/util/errors'
import { api, type RoobetReq } from 'src/util/api'
import { twilioVerifications } from 'src/vendors/twilio/documents'
import { sendVerification, checkVerification } from 'src/vendors/twilio'
import { determineSingleFeatureAccess } from 'src/util/features'

import { KYC } from 'src/modules/fraud/kyc'
import { parseAndValidatePhoneNumber } from './kycv2'
import { isSupportedCountry } from 'libphonenumber-js'

export default function (app: express.Router) {
  const router = express.Router()
  app.use('/kyc', router)

  router.get(
    '/get',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      return await KYC.getForUserId(user.id)
    }),
  )

  router.get(
    '/phone',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const [kyc, activePhoneNumberVerification] = await Promise.all([
        KYC.getForUserId(user.id),
        twilioVerifications.getActivePhoneNumberVerification(user.id),
      ])

      if (activePhoneNumberVerification) {
        return {
          phone: activePhoneNumberVerification.phoneNumber,
          phoneVerified: false,
          verifying: true,
        }
      }
      return {
        phone: kyc.phone,
        phoneVerified: !!kyc.phoneVerified,
        verifying: false,
      }
    }),
  )

  router.post(
    '/setPhoneNumber',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      // TODO remove when Twilio Phone Number Verifications are fully released
      const userCanUseTwilio = await determineSingleFeatureAccess({
        featureName: 'twilioPhoneNumber',
        user,
        countryCode: '',
      })
      if (!userCanUseTwilio) {
        throw new APIValidationError('slow_down')
      }

      const phoneNumber = req.body.phoneNumber

      if (!isSupportedCountry(user.countryCode)) {
        throw new APIValidationError('kyc__invalid_region_with_number')
      }

      const validPhoneNumber = await parseAndValidatePhoneNumber(
        phoneNumber,
        user.countryCode,
      )
      if (!validPhoneNumber) {
        throw new APIValidationError('api__invalid_param', ['Phone Number'])
      }

      await sendVerification(user.id, validPhoneNumber)
    }),
  )

  router.post(
    '/checkPhoneNumber',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      // TODO remove when Twilio Phone Number Verifications are fully released
      const userCanUseTwilio = await determineSingleFeatureAccess({
        featureName: 'twilioPhoneNumber',
        user,
        countryCode: '',
      })
      if (!userCanUseTwilio) {
        throw new APIValidationError('slow_down')
      }

      if (!req.body.code) {
        throw new APIValidationError('api__missing_param', ['Code'])
      }

      const verified = await checkVerification(user.id, req.body.code)
      if (!verified) {
        throw new APIValidationError('auth__invalid_token')
      }
    }),
  )
}
