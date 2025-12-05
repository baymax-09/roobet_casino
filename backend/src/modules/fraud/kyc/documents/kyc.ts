import moment from 'moment'
import { type FilterQuery } from 'mongoose'

import { scopedLogger } from 'src/system/logger'
import { type DBCollectionSchema } from 'src/modules'
import { addNoteToUser } from 'src/modules/admin/documents/user_notes'
import * as KYC from 'src/modules/fraud/kyc'
import { APIValidationError } from 'src/util/errors'
import { megaloMongo, config } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import { getUserById } from 'src/modules/user'
import { slackKycLevel1Alert } from 'src/vendors/slack'
import {
  getDocuments,
  softDeleteDocumentById,
} from 'src/modules/user/documents/documents'
import { type VerifiedKYCLevel } from 'src/modules/fraud/kyc'

import { type KycNeededResponse, type KYCRecord } from '../types'
import { fraudLogger } from '../../lib/logger'

const KYCLogger = scopedLogger('KYC')

const KycSchema = new megaloMongo.Schema<KYCRecord>(
  {
    userId: { type: String, index: true, unique: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    searchName: { type: String, default: '' }, // for fuzzy searching
    sourceOfFunds: { type: String, default: '' },
    addressLine1: { type: String, default: '' },
    addressLine2: { type: String, default: '' },

    // These 3 make up "city line" which is required.
    addressCity: { type: String, default: '' }, // or town
    addressPostalCode: { type: String, default: '' },
    addressState: { type: String, default: '' }, // or province

    addressCountry: { type: String, default: '' },

    dob: { type: String, default: '' },
    phone: { type: String, index: true, default: '' },
    phoneVerified: { type: Boolean, default: false },

    // Legacy fields.
    legacyAddress: { type: String, default: '' },
    legacyName: { type: String, default: '' },

    // @ts-expect-error TODO should probably be a nested schema
    validationResults: { type: Array },
    levels: { type: Object },
    manualLevelVerification: {
      type: Map,
      of: Boolean,
    },
    georestricted: { type: Boolean, default: false },
    // Reason why the restriction was applied
    kycRequiredReason: { type: String },
    kycRestrictAccount: { type: Boolean },
  },
  { timestamps: true },
)

KycSchema.index({ firstName: 'text', lastName: 'text' }, { sparse: true })

export const KycModel = megaloMongo.model<KYCRecord>('kyc_v2', KycSchema)

// TODO Require user object here, don't return a partial.
export async function getForUser(user?: UserTypes.User | null): Promise<
  Partial<KYCRecord & KycNeededResponse> & {
    kyc?: KYCRecord
    rejectedReasons?: string[]
  }
> {
  if (!user) {
    fraudLogger('revalidateKycLevel', { userId: null }).error(
      'getKycForUserError null user passed',
    )
    return {}
  }

  const userId = user.id

  let kyc: KYCRecord | null = await KycModel.findOne({ userId }).lean()

  // Create new KYC document if one does not exist.
  if (!kyc) {
    const kycResult = await upsertForUser(userId, {})
    return kycResult.kyc
  }

  // We need to populate the .levels values if they do not exist.
  if (!kyc.levels) {
    const result = await KYC.revalidateKycLevelForUser(user, kyc)

    kyc = result.newKyc
  }

  // DON'T TOUCH THIS FE NEEDS IT LIKE THIS
  return { ...kyc, ...KYC.checkUserNeedsKyc(user), kyc }
}

export async function getForUserId(userId: string) {
  const user = await getUserById(userId)

  return await getForUser(user)
}

export async function findOne(
  filter: FilterQuery<KYCRecord>,
): Promise<KYCRecord | null> {
  return await KycModel.findOne(filter).lean()
}

export async function upsertForUser(
  userId: string,
  payload: Partial<KYCRecord>,
  updatedByUser = false,
) {
  // Users may not update these fields.
  if (updatedByUser) {
    delete payload.phoneVerified
    delete payload.userId
    delete payload.legacyAddress
    delete payload.legacyName
  }

  const user = await getUserById(userId)

  if (!user) {
    throw new Error('User does not exists.')
  }

  const oldKyc: Partial<KYCRecord> =
    (await KycModel.findOne({ userId }).lean()) ?? {}

  if (payload.dob && !moment(payload.dob, 'DD/MM/YYYY').isValid()) {
    throw new APIValidationError('kyc__invalid_dob', [], { field: 'dob' })
  }

  if (
    payload.dob &&
    moment().diff(moment(payload.dob, 'DD/MM/YYYY'), 'years') < 18
  ) {
    throw new APIValidationError('kyc__underage', [], { field: 'dob' })
  }

  // Validate postal code.
  // Removing this check for now, we may add it back later.
  // if (payload.addressCountry && payload.addressPostalCode) {
  //   const valid = PostalCodes.validate(payload.addressCountry, payload.addressPostalCode)

  //   if (valid !== true) {
  //     throw new APIValidationError('kyc__invalid_postal_code')
  //   }
  // }

  if (
    payload.addressCity &&
    config.cityBlocks.includes(payload.addressCity.toLowerCase())
  ) {
    throw new APIValidationError('kyc__restricted_country', [], {
      field: 'addressCity',
    })
  }

  if (
    payload.addressState &&
    config.cityBlocks.includes(payload.addressState.toLowerCase())
  ) {
    throw new APIValidationError('kyc__restricted_country', [], {
      field: 'addressState',
    })
  }

  for (const property in payload) {
    // @ts-expect-error we want to trim all string properties no matter what
    payload[property] =
      // @ts-expect-error we want to trim all string properties no matter what
      typeof payload[property] === 'string'
        ? // @ts-expect-error we want to trim all string properties no matter what
          payload[property].trim()
        : // @ts-expect-error we want to trim all string properties no matter what
          payload[property]
  }

  await KycModel.findOneAndUpdate({ userId }, payload, {
    upsert: true,
  })

  const newKyc = await KycModel.findOneAndUpdate(
    { userId },
    [{ $set: { searchName: { $concat: ['$firstName', ' ', '$lastName'] } } }],
    {
      new: true,
      upsert: true,
    },
  ).lean()

  await KYC.revalidateKycLevel(userId, newKyc)

  const kyc = await getForUser(user)

  // Write differences to user note.
  if (updatedByUser) {
    try {
      const fields = [
        'firstName',
        'lastName',
        'addressLine1',
        'addressLine2',
        'addressCity',
        'addressState',
        'addressCountry',
        'phone',
        'dob',
      ] as const

      const differences = fields
        .filter(field => kyc[field] !== oldKyc[field])
        .reduce(
          (diff, field) => ({
            ...diff,
            [field]: `${oldKyc[field]} => ${kyc[field]}`,
          }),
          {},
        )

      // Slack the differences in lvl 1 KYC attrs, if there are any
      if (Object.keys(differences).length !== 0) {
        let slackKycLevel1AlertMessage = `${user.name} - [${user.id}] - Submitted KYC Level 1.\n`

        fields.forEach(attribute => {
          slackKycLevel1AlertMessage += `${attribute}: “${oldKyc[attribute]}” => “${kyc[attribute]}”\n`
        })

        slackKycLevel1Alert(slackKycLevel1AlertMessage)
      }

      // FIXME: Can we store this diff as an object and handle the render on the view?
      await addNoteToUser(
        userId,
        user,
        `User updated KYC: ${JSON.stringify(differences)}`,
        'userAction',
      )
    } catch (error) {
      fraudLogger('upsertForUser', { userId }).error(
        'Failed to add user note for KYC change',
        error,
      )
    }
  }

  return { kyc, validationResults: kyc.validationResults }
}

export async function searchFirstAndLastNames(
  name: string,
): Promise<Array<{ firstName: string; lastName: string; userId: string }>> {
  const limitSetting = 50
  if (config.isLocal) {
    return await (KycModel.aggregate([
      { $match: { searchName: { $regex: name, $options: 'i' } } },
    ]).limit(limitSetting) || [])
  }
  return (
    (await KycModel.aggregate([
      {
        $search: {
          index: 'searchName',
          text: {
            query: name,
            path: ['searchName'],
            fuzzy: {
              maxEdits: 2,
            },
          },
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          userId: 1,
        },
      },
    ]).limit(limitSetting)) || []
  )
}

export const updateById = async (id: string, payload: Partial<KYCRecord>) => {
  return await KycModel.findByIdAndUpdate(id, payload, {
    new: true,
  }).lean<KYCRecord>()
}

export const updateByUserId = async (
  userId: string,
  payload: Partial<KYCRecord>,
) => {
  return await KycModel.findOneAndUpdate({ userId }, payload, {
    new: true,
  }).lean<KYCRecord>()
}

export const updateManualLevelVerification = async (
  userId: string,
  level: VerifiedKYCLevel,
  value: boolean,
) => {
  const updateString = `manualLevelVerification.${level}`
  return await KycModel.findOneAndUpdate(
    { userId },
    { $set: { [updateString]: value } },
    { new: true },
  ).lean<KYCRecord>()
}

export const resetKYCLevel = async (
  kyc: KYCRecord,
  level: number,
  adminUserId: string,
) => {
  const logger = KYCLogger('resetKYCLevel', { userId: adminUserId })

  const updatedKyc = await (async () => {
    logger.info(`resetKYCLevel ${level}`, {
      kycDoc: kyc,
      level,
    })
    if (level === 1) {
      return await resetLevel1(kyc)
    }
    if (level === 2) {
      return await resetLevel2(kyc)
    }

    if (level === 3) {
      return await resetLevel3(kyc)
    }

    if (level === 4) {
      return await resetLevel4(kyc)
    }

    return undefined
  })()

  if (!updatedKyc) {
    return kyc
  }

  // Revalidate KYC Level for the user
  await KYC.revalidateKycLevel(updatedKyc.userId, updatedKyc)
  logger.info('revalidateKycLevel', {
    kycDoc: updatedKyc,
  })

  return kyc
}

const resetLevel1 = async (kyc: KYCRecord) => {
  const updatePayload = {
    firstName: '',
    lastName: '',
    dob: '',
    addressLine1: '',
    addressLine2: '',
    addressPostalCode: '',
    addressState: '',
    addressCountry: '',
    addressCity: '',
  }
  // Update the KYC
  const updatedKYC = await updateById(kyc._id, updatePayload)

  return updatedKYC
}

const resetLevel2 = async (kyc: KYCRecord) => {
  const filter: FilterQuery<UserTypes.UserDocuments> = {
    userId: kyc.userId,
    type: 'identity',
  }

  // Soft delete each of the user documents
  const userDocuments = await getDocuments(filter)

  await Promise.all(
    userDocuments.map(async document => {
      await softDeleteDocumentById(document._id)
    }),
  )

  return kyc
}

const resetLevel3 = async (kyc: KYCRecord) => {
  const filter: FilterQuery<UserTypes.UserDocuments> = {
    userId: kyc.userId,
    type: 'address',
  }

  // Soft delete each of the user documents
  const userDocuments = await getDocuments(filter)

  await Promise.all(
    userDocuments.map(async document => {
      await softDeleteDocumentById(document._id)
    }),
  )

  return kyc
}

const resetLevel4 = async (kyc: KYCRecord) => {
  const filter: FilterQuery<UserTypes.UserDocuments> = {
    userId: kyc.userId,
    type: 'sof',
  }

  // Soft delete each of the user documents
  const userDocuments = await getDocuments(filter)

  await Promise.all(
    userDocuments.map(async document => {
      await softDeleteDocumentById(document._id)
    }),
  )

  return kyc
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: 'kyc_v2',
}
