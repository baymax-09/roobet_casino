import fs from 'fs'
import { type UpdatePayload, type FilterQuery, type Document } from 'mongoose'
import mongooseDelete, {
  type SoftDeleteInterface,
  type SoftDeleteModel,
} from 'mongoose-delete'

import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'
import * as Kyc from 'src/modules/fraud/kyc'
import { sleep } from 'src/util/helpers/timer'
import { media } from 'src/util/media'
import { tuid } from 'src/util/i18n'
import { createNotification } from 'src/modules/messaging/notifications/documents/notification'

import { type Types as UserTypes } from 'src/modules/user'
import { getUserById } from 'src/modules/user'
import { userLogger } from '../lib/logger'

export const DocumentStatuses = [
  'approved',
  'rejected',
  'in_review',
  'escalated',
  'flagged',
] as const
export type DocumentStatus = (typeof DocumentStatuses)[number]
export const StatusMap: Record<string, DocumentStatus> = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_REVIEW: 'in_review',
  ESCALATED: 'escalated',
  FLAGGED: 'flagged',
}
export const isDocumentStatusType = (value: any): value is DocumentStatus =>
  DocumentStatuses.includes(value)

export interface UserDocuments extends SoftDeleteInterface {
  _id: string
  type: string
  key: string
  uniqueKey?: string
  status: DocumentStatus
  autoRejected?: boolean
  totalDeposited?: number
  totalWithdrawn?: number
  userId: string
  shuftiCallbackResponse?: any
  reviewedBy?: string
  reviewedAt?: Date
  createdAt?: Date
}

const UserDocumentsSchema = new mongoose.Schema<UserDocuments & Document>(
  {
    type: { type: String },
    key: { type: String, index: true },
    uniqueKey: {
      type: String,
      index: {
        unique: true,
        partialFilterExpression: { uniqueKey: { $type: 'string' } },
      },
    },
    status: {
      type: String,
      enum: DocumentStatuses,
      default: StatusMap.IN_REVIEW,
    },
    autoRejected: { type: Boolean },
    totalDeposited: { type: Number },
    totalWithdrawn: { type: Number },
    userId: { type: String, index: true },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    shuftiCallbackResponse: {},
  },
  { timestamps: true },
)

UserDocumentsSchema.index({
  type: 1,
  userId: 1,
})

UserDocumentsSchema.plugin(mongooseDelete, {
  deletedBy: false,
  deletedAt: true,
  indexFields: 'all',
})

const UserDocumentsModel = mongoose.model<UserDocuments>(
  'user_documents',
  UserDocumentsSchema,
) as unknown as SoftDeleteModel<UserDocuments & Document>

export async function checkIfUserDocumentExists(
  userId: string,
  type: string,
): Promise<UserDocuments | null> {
  return await UserDocumentsModel.findOne({
    userId,
    type,
    deleted: { $ne: true },
    status: { $ne: StatusMap.REJECTED },
  }).lean()
}

export async function getLatestDocument(
  filter: FilterQuery<UserDocuments>,
): Promise<UserDocuments[]> {
  return await UserDocumentsModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(1)
    .lean()
}

export async function getDocuments(
  filter: FilterQuery<UserDocuments>,
  sort: Record<string, 1 | -1> = { createdAt: -1 },
): Promise<UserDocuments[]> {
  return await UserDocumentsModel.find(filter).sort(sort).lean()
}

export async function getUserGroupedPendingDocuments(
  limit: number,
  skip: number,
  sort: { updatedAt: 1 | -1 },
): Promise<{
  total: number
  sample: UserDocuments[]
}> {
  const [result] = await UserDocumentsModel.aggregate<{
    count: [{ total: number }]
    sample: UserDocuments[]
  }>([
    {
      $match: {
        status: { $nin: [StatusMap.APPROVED, StatusMap.REJECTED] },
        deleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: '$userId',
        root: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$root' } },
    {
      $facet: {
        count: [{ $count: 'total' }],
        sample: [{ $sort: sort }, { $skip: skip }, { $limit: limit }],
      },
    },
  ])

  return {
    total: result.count[0]?.total || 0,
    sample: result.sample,
  }
}

export async function getDocumentById(
  id: string,
): Promise<UserDocuments | null> {
  return await UserDocumentsModel.findById(id)
}

export const getDocumentByKey = async (key: string) => {
  return await UserDocumentsModel.findOne({ key }).lean<
    UserDocuments | undefined
  >()
}

export const documentExistsByKey = async (key: string) => {
  return await UserDocumentsModel.exists({ key })
}

export async function approveDocumentByKey(
  key: string,
  extras: {
    reviewedBy?: string
  } = {},
) {
  const { reviewedBy } = extras
  const result = await UserDocumentsModel.findOneAndUpdate(
    { key, deleted: { $ne: true } },
    {
      status: StatusMap.APPROVED,
      reviewedBy,
      reviewedAt: Date.now(),
    },
    { new: true },
  )

  // TODO side effects do not belong in the documents
  if (result) {
    const message = await tuid(result.userId, 'user__verification_doc_accepted')
    createNotification(result.userId, message, 'kyc')
    await Kyc.revalidateKycForUser(result.userId)
  }
}

export const updateDocumentById = async (
  id: string,
  updates: Partial<Omit<UserDocuments, 'id'>>,
) => {
  await UserDocumentsModel.findOneAndUpdate({ _id: id }, updates)
}

export async function updateDocumentByKey(
  key: string,
  update: UpdatePayload<UserDocuments>,
) {
  await UserDocumentsModel.findOneAndUpdate({ key }, update)
}

export async function softDeleteDocumentById(id: string) {
  await UserDocumentsModel.deleteById(id)
}

export async function getDocumentCounts() {
  const totalUsersNeedApprovalList = await UserDocumentsModel.aggregate([
    {
      $match: {
        status: { $nin: [StatusMap.APPROVED, StatusMap.REJECTED] },
        deleted: { $ne: true },
      },
    },
    { $group: { _id: { userId: '$userId' } } },
    { $count: 'totalUsers' },
  ])
  const totalUsersNeedApproval = totalUsersNeedApprovalList[0]?.totalUsers || 0
  const totalDocuments = await UserDocumentsModel.countDocuments({}).exec()
  const needsApprovalDocs = await UserDocumentsModel.find({
    status: { $nin: [StatusMap.APPROVED, StatusMap.REJECTED] },
  }).countDocuments()
  return {
    totalDocuments,
    needApproval: totalUsersNeedApproval,
    needsApprovalDocs,
  }
}

export async function rejectDocumentByKey(
  key: string,
  deleteFromAWS = false,
  sendNotification = true,
  deletedBy?: string,
): Promise<void> {
  const doc = await UserDocumentsModel.findOne({ key }).lean()

  if (doc) {
    if (sendNotification) {
      const message = await tuid(doc.userId, 'user__verification_doc_rejected')
      createNotification(doc.userId, message, 'kyc')
    }

    await updateDocumentByKey(key, {
      status: StatusMap.REJECTED,
      reviewedBy: deletedBy,
      reviewedAt: Date.now(),
    })

    await Kyc.revalidateKycForUser(doc.userId)
  }

  if (deleteFromAWS) {
    // Delete doc from database.
    await UserDocumentsModel.deleteMany({ key })

    // Remove object from S3.
    await media.delete({ dest: 'verification', path: key })
  }
}

export async function saveUserDocument(
  documentType: string,
  userId: string,
  path: string,
  documentFields: Partial<UserDocuments> = {},
): Promise<UserTypes.UserDocuments | null> {
  try {
    // Write media document to database.
    const dbDoc = await UserDocumentsModel.create({
      userId,
      key: path,
      type: documentType,
      status: StatusMap.IN_REVIEW,
      ...(documentFields && documentFields),
    })

    // Manually call KYC revalidation.
    await Kyc.revalidateKycForUser(userId)

    return dbDoc
  } catch (error) {
    // Error most likely from duplicate key error
    userLogger('saveUserDocument', { userId }).error(
      `Error saving user document. unique-key: ${documentFields?.uniqueKey}`,
      {
        uniqueKey: documentFields?.uniqueKey,
      },
      error,
    )
    return null
  }
}

export async function uploadUserDocument(
  documentType: string,
  userId: string,
  key: string,
  filePathOrBuffer: string | Buffer,
  documentFields?: Partial<UserDocuments>,
  skipS3Upload = false,
): Promise<UserTypes.UserDocuments | null> {
  try {
    const path = `user/${userId}/${key}`
    // Write media document to database.
    const dbDoc = await UserDocumentsModel.create({
      userId,
      key: path,
      type: documentType,
      status: StatusMap.IN_REVIEW,
      ...(documentFields && documentFields),
    })

    /* We are uploading directly to S3 when using signed URL's on the client side. In these cases,
     *  we do not need to upload to S3 on the server side. More info on how these work here:
     *  https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html
     */
    if (!skipS3Upload) {
      const body =
        typeof filePathOrBuffer === 'string'
          ? fs.createReadStream(filePathOrBuffer)
          : filePathOrBuffer

      await media.upload({
        path,
        contents: body,
        dest: 'verification',
      })
    }

    // Manually call KYC revalidation.
    await Kyc.revalidateKycForUser(userId)

    return dbDoc
  } catch (error) {
    // Error most likely from duplicate key error
    userLogger('uploadUserDocument', { userId }).error(
      `Error uploading user document. unique-key: ${documentFields?.uniqueKey}`,
      {
        uniqueKey: documentFields?.uniqueKey,
      },
      error,
    )
    return null
  }
}

export async function deleteIfNonExistentUser(): Promise<void> {
  let batchIndex = 0
  const count = await UserDocumentsModel.countDocuments({}).exec()
  while (true) {
    const batch = await UserDocumentsModel.find()
      .skip(batchIndex * 20000)
      .limit(20000)
    if (batch.length === 0) {
      break
    }
    let deleteOf1k = 0
    for (const row of batch) {
      const user = await getUserById(row.userId)
      if (!user) {
        await rejectDocumentByKey(row.key, true)
        deleteOf1k++
      } else {
        await updateDocumentByKey(row.key, {
          totalDeposited: user.hiddenTotalDeposited,
          totalWithdrawn: user.hiddenTotalWithdrawn,
        })
      }
    }
    userLogger('deleteIfNonExistentUser', { userId: null }).info(
      `${
        batchIndex * 20000
      }/${count} Removed ${deleteOf1k} non-existent user document`,
    )
    await sleep(2000)
    batchIndex++
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: UserDocumentsModel.collection.name,
  bigCleanups: [deleteIfNonExistentUser], // TODO bigCleanups are currently disabled
}
