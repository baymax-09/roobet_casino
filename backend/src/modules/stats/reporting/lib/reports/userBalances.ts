import crypto from 'crypto'
import fetch from 'node-fetch'
import FormData from 'form-data'
import json2csv from 'json2csv'
import shortid from 'shortid'
import moment from 'moment'

import { config } from 'src/system'
import { User } from 'src/modules/user'
import {
  UserObjectBalanceFields,
  type UserObjectBalanceField,
} from 'src/modules/user/types'

import { logUserBalanceReport } from '../../documents'

type UserBalance = { id: string } & Record<UserObjectBalanceField, number>

const PAGE_SIZE = 2000
const ENCRYPTION_ALGO = 'aes-256-cbc'

// Sort field names so CSV columns are in a consistent order.
const FIELDS = ['id', ...[...UserObjectBalanceFields].sort()]

const { licenseUploadEndpoint, licenseEncryptionKey } =
  config.reporting.config.userBalances

// Default all balance fields to 0 if it isn't present in the document.
const fillBalance = (balance: UserBalance): UserBalance => ({
  id: balance.id,
  ...UserObjectBalanceFields.reduce(
    (acc, type) => ({
      ...acc,
      [type]: balance[type] ?? 0,
    }),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    {} as Omit<UserBalance, 'id'>,
  ),
})

const encrypt = (data: string): { iv: string; content: string } => {
  // Create cryptographically secure random data.
  const iv = crypto.randomBytes(16)

  // Create cipher using our key and generated iv.
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGO,
    licenseEncryptionKey,
    iv,
  )

  let content = cipher.update(data, 'utf-8', 'hex')
  content += cipher.final('hex')

  return { content, iv: iv.toString('hex') }
}

/*
  This is not used anywhere, but should be left for reference.

  const decrypt = ({ iv, content }: { iv: string, content: string }): string => {
    const hexIv = Buffer.from(iv, 'hex')

    // Create decipher using our key and previously generated iv.
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGO, licenseEncryptionKey, hexIv)

    let raw = decipher.update(content, 'hex', 'utf-8')
    raw += decipher.final('utf8')

    return raw
  }
*/

export const userBalances = async (): Promise<string> => {
  const getQuery = (page = 0) =>
    User.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
      .orderBy('createdAt')
      .pluck(FIELDS)

  const userBalances: UserBalance[] = []

  for (let i = 0; ; i++) {
    const results: UserBalance[] = await getQuery(i).run()

    // Pushed mapped values into results array.
    userBalances.push(...results.map(fillBalance))

    if (results.length < PAGE_SIZE) {
      break
    }
  }

  return json2csv({ data: userBalances, fields: FIELDS })
}

export const userBalancesAfterRun = async (_: object, report: string) => {
  // Encrypt file contents.
  const encrypted = encrypt(report)

  const date = moment().format('DD-MM-YYYY')
  const filename = `user-balance-report-${date}-${shortid.generate()}.csv`

  // Write to collection.
  await logUserBalanceReport({
    filename,
    iv: encrypted.iv,
    contents: encrypted.content,
    algo: ENCRYPTION_ALGO,
  })

  const body = new FormData()

  // Append encrypted file contents. The key, filename,
  // and contentType must match this exactly.
  body.append('data', encrypted.content, {
    filename,
    contentType: 'application/octet-stream',
  })

  await fetch(licenseUploadEndpoint, {
    method: 'POST',
    body,
  })
}
