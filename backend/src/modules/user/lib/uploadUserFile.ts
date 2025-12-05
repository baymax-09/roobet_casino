import { addNoteToUser } from 'src/modules/admin/documents/user_notes'
import { APIValidationError } from 'src/util/errors'
import { media } from 'src/util/media'
import { isPoaDocument } from 'src/modules/fraud/kyc/lib/addressVerify'
import { kycUserInfoToString } from 'src/modules/fraud/util'
import {
  slackKycLevel2Alert,
  slackKycLevel3Alert,
  slackKycLevel4Alert,
} from 'src/vendors/slack'

import { type User } from 'src/modules/user/types'
import { isValidVerificationDocumentType } from './verification'
import {
  rejectDocumentByKey,
  checkIfUserDocumentExists,
  saveUserDocument,
  documentExistsByKey,
} from '../documents/documents'
import { userLogger } from './logger'

interface UploadUserFileArgs {
  documentType: string
  user: User
  override?: boolean
  hashedFileName: string
}

export const uploadUserFile = async ({
  documentType,
  user,
  override,
  hashedFileName,
}: UploadUserFileArgs) => {
  // Validate document type.
  if (!isValidVerificationDocumentType(documentType)) {
    throw new APIValidationError('invalid__document_type')
  }

  const documentExists = await checkIfUserDocumentExists(user.id, documentType)

  if (documentExists) {
    if (override) {
      userLogger('uploadUserFile', { userId: null }).info(
        `deleting document ${documentExists.key}`,
        { documentKey: documentExists.key },
      )
      // delete existing document and start over
      await rejectDocumentByKey(documentExists.key, true, false)
    }

    if (documentExists.status === 'approved' && !override) {
      throw new APIValidationError('document__already_upload')
    }
  }

  // Upload file to AWS bucket.
  const filePath = `user/${user.id}/${documentType}-${hashedFileName}`

  // Check if document already exists with this file key.
  if (await documentExistsByKey(filePath)) {
    throw new APIValidationError('invalid__document')
  }

  const userKycDocument = await saveUserDocument(
    documentType,
    user.id,
    filePath,
  )

  // We don't use Shufti on Proof of Address documents
  if (userKycDocument) {
    if (isPoaDocument(userKycDocument)) {
      slackKycLevel3Alert(
        `ShuftiKycAlert ${await kycUserInfoToString(
          userKycDocument.userId,
        )} uploaded their KYC Level 3 document for review.`,
      )
    } else {
      ;(async () => {
        const file = await media.download({
          dest: 'verification',
          path: userKycDocument.key,
        })

        if (file) {
          if (documentType === 'identity') {
            slackKycLevel2Alert(
              `${user.name} [${user.id}] uploaded their KYC Level 2 document for review.`,
            )
          }
          if (userKycDocument.type === 'sof') {
            const message = `KycAlert ${user.name} [${user.id}] uploaded their KYC Level 4 document for review.`
            slackKycLevel4Alert(message)
          }
        }
      })()
    }
  }
  await addNoteToUser(
    user.id,
    user,
    `Uploaded KYC Document (${documentType})`,
    'userAction',
  )
}
