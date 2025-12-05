import twilio from 'twilio'

import { config } from 'src/system'
import { KYC } from 'src/modules/fraud/kyc'
import { updateConsentForUserId } from 'src/modules/crm/documents/consent'

import { twilioVerifications } from './documents'

export * as Documents from './documents'

const twilioClient = twilio(config.twilio.sid, config.twilio.authToken)

export const sendVerification = async (userId: string, to: string) => {
  // It costs money to lookup and verify phone numbers, so guarding against multiple attempts
  const [kyc, activePhoneNumberVerification] = await Promise.all([
    KYC.getForUserId(userId),
    twilioVerifications.getActivePhoneNumberVerification(userId),
  ])

  if (kyc.phoneVerified || activePhoneNumberVerification) {
    return
  }

  if (config.isProd) {
    // Twilio test keys do not support phone number lookups
    await twilioClient.verify
      .services(config.twilio.verifyServiceSid)
      .verifications.create({ to, channel: 'sms' })
  }

  await twilioVerifications.setVerificationPhoneNumber(userId, to)
}

export const checkVerification = async (userId: string, code: string) => {
  const verification =
    await twilioVerifications.getActivePhoneNumberVerification(userId)
  const phoneNumber = verification?.phoneNumber

  if (phoneNumber) {
    const result = config.isProd
      ? await twilioClient.verify
          .services(config.twilio.verifyServiceSid)
          .verificationChecks.create({ to: phoneNumber, code })
      : { status: 'approved' }

    if (result?.status === 'approved') {
      await KYC.upsertForUser(userId, {
        phone: phoneNumber,
        phoneVerified: true,
      })
      await twilioVerifications.deleteVerificationPhoneNumber(userId)
      await updateConsentForUserId(userId, { sms: true })
      return true
    }
  }
  return false
}
