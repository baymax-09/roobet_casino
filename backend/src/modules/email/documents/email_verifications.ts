import crypto from 'crypto'
import moment from 'moment'

import { r, config } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { cleanupOldTable } from 'src/util/rethink'

export interface EmailVerification {
  userId: string
  email: string
  timestamp: Date
  id: string
}

const EmailVerifications = r.table<EmailVerification>('email_verifications')

export async function createVerification(
  userId: string,
  email: string,
): Promise<string> {
  await EmailVerifications.getAll(userId, { index: 'userId' }).delete().run()

  const text = email
  const key = config.session.secret ? config.session.secret : 'secretkey'

  const id = crypto.createHmac('sha1', key).update(text).digest('hex')

  await EmailVerifications.insert({
    userId,
    email,
    timestamp: r.now(),
    id,
  }).run()

  return id
}

export async function getVerification(
  token: string,
): Promise<EmailVerification | undefined> {
  const verification = await EmailVerifications.get(token).run()
  if (verification && moment() < moment(verification.timestamp).add(1, 'day')) {
    return verification
  }
}

export async function removeVerification(token: string) {
  return await EmailVerifications.get(token).delete().run()
}

async function cleanupOldEmailVerifications(): Promise<void> {
  await cleanupOldTable(
    'email_verifications',
    r.now().sub(60 * 60 * 24 * 2),
    'timestamp',
  )
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'email_verifications',
  indices: [{ name: 'userId' }, { name: 'timestamp' }],
  cleanup: [cleanupOldEmailVerifications],
}
