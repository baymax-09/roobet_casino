import crypto from 'crypto'
import { type ObjectId } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

interface UserBalanceReports {
  _id: ObjectId
  iv: string
  filename: string
  algo: string
  sentAt: string
  checksum: {
    algo: string
    hash: string
  }
}

const UserBalanceReportsSchema = new mongoose.Schema<UserBalanceReports>({
  iv: { type: String, required: true },
  filename: { type: String, required: true },
  sentAt: { type: String, required: true },
  algo: { type: String, required: true },
  checksum: {
    required: true,
    type: {
      algo: { type: String, required: true },
      hash: { type: String, required: true },
    },
  },
})

const UserBalanceReportsModel = mongoose.model<UserBalanceReports>(
  'user_balance_reports',
  UserBalanceReportsSchema,
)

const hashUserBalanceReportContent = (
  contents: string,
): UserBalanceReports['checksum'] => {
  const algo = 'sha256'

  return {
    algo,
    hash: crypto.createHash(algo).update(contents).digest('hex'),
  }
}

export const logUserBalanceReport = async ({
  filename,
  contents,
  algo,
  iv,
}: {
  filename: string
  contents: string
  algo: string
  iv: string
}) =>
  await UserBalanceReportsModel.create({
    iv,
    algo,
    filename,
    sentAt: new Date().toISOString(),
    checksum: hashUserBalanceReportContent(contents),
  })

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'user_balance_reports',
}
