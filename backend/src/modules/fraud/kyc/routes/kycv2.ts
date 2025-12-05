import express from 'express'

import { translateForUser } from 'src/util/i18n'
import { config, io } from 'src/system'
import { api, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { assessRisk, RiskStatus } from 'src/modules/fraud/riskAssessment'
import { getIpFromRequest } from 'src/modules/fraud/geofencing'
import { createNotification } from 'src/modules/messaging'
import { addNoteToUser } from 'src/modules/admin/documents/user_notes'
import { changeSystemEnabledUser } from 'src/modules/userSettings'

import { KYC } from 'src/modules/fraud/kyc'
import { logAdminAction, roleCheck } from 'src/modules/admin/middleware'
import { createAuditRecord } from 'src/modules/audit'
import { type Audit } from 'src/modules/audit/documents/audit'
import { slackKycLevel1RGAlert } from 'src/vendors/slack'
import parsePhoneNumber, {
  isSupportedCountry,
  isValidPhoneNumber,
  type CountryCode,
} from 'libphonenumber-js'

export const parseAndValidatePhoneNumber = async (
  phone: string,
  countryCode: CountryCode,
) => {
  const phoneNumber = parsePhoneNumber(phone, countryCode)

  if (
    !phoneNumber ||
    !phoneNumber.number ||
    typeof phoneNumber.number !== 'string'
  ) {
    return undefined
  }

  const isValid = isValidPhoneNumber(phoneNumber?.number, countryCode)

  if (!isValid) {
    return undefined
  }

  return phoneNumber.number
}

export default function (app: express.Router) {
  const router = express.Router()
  app.use('/kycv2', router)

  router.post(
    '/saveLevel1Details',
    api.check,
    api.validatedApiCall(async req => {
      const { kycInfo } = req.body
      const { user } = req as RoobetReq

      if (kycInfo.phone) {
        if (!isSupportedCountry(kycInfo.addressCountry)) {
          throw new APIValidationError('kyc__invalid_region_with_number')
        }

        const validatedPhone = await parseAndValidatePhoneNumber(
          kycInfo.phone,
          kycInfo.addressCountry,
        )

        if (!validatedPhone) {
          throw new APIValidationError('kyc__invalid_phone_number')
        }
        kycInfo.phone = validatedPhone
      }

      const ip = await getIpFromRequest(req, config.seon.fallbackIPAddress)
      const session = {
        id: req.sessionID,
        data: (req.headers['x-seon-session-payload'] as string) || '',
      }

      const fraudResponse = await assessRisk({
        user,
        ip,
        session,
        actionType: 'kyc_level1_save',
        customFields: { kyc: kycInfo },
      })

      if (
        (fraudResponse?.seonResponse?.data?.applied_rules ?? []).find(
          rule => rule.name && rule.name.includes('Self excluded'),
        )
      ) {
        slackKycLevel1RGAlert(
          `Level 1 KYC self-excluded rule triggered for ${user.id} [${user.name}]`,
        )
      }

      if (fraudResponse?.state === RiskStatus.DECLINED) {
        await createNotification(
          user.id,
          translateForUser(user, 'kyc__invalid_region'),
          'kyc',
        )
        await addNoteToUser(
          user.id,
          user,
          'Level 1 KYC declined by Seon. Deposits, Tips and Bets disabled.',
        )
        const disabledSystems = ['bets', 'tip', 'deposit'] as const
        kycInfo.georestricted = true
        for (const system of disabledSystems) {
          await changeSystemEnabledUser(user.id, system, false)
        }
      }
      return await KYC.upsertForUser(user.id, kycInfo, true)
    }),
  )

  router.post(
    '/toggleGeoRestriction',
    ...roleCheck([{ resource: 'kyc', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, isGeoRestricted } = req.body

      if (typeof isGeoRestricted !== 'boolean') {
        throw new APIValidationError('kyc__invalid_georestrict')
      }

      if (!userId) {
        throw new APIValidationError('kyc__invalid_user_id')
      }
      const auditData: Omit<Audit, 'success'> = {
        editorId: adminUser.id,
        subjectId: userId,
        actionType: 'toggleGeoRestrict',
        databaseAction: 'edit',
        notes: 'Georestrict toggled by admin',
      }

      const response = await createAuditRecord(auditData, async () => {
        await KYC.updateByUserId(userId, { georestricted: isGeoRestricted })
      })
      io.to(userId).emit('kyc_change')

      return response
    }),
  )
}
