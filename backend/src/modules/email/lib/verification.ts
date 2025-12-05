import { type Request } from 'express'

import { emailLogger } from './logger'
import {
  updateUser,
  getUserById,
  type Types as UserTypes,
} from 'src/modules/user'
import { recordStats } from 'src/modules/stats'
import { updateIntercomContact } from 'src/vendors/intercom'
import { sendVerificationEmail as mailgunSendVerificationEmail } from 'src/vendors/mailgun'
import { publishCustomFastTrackEvent } from 'src/vendors/fasttrack'
import { type User } from 'src/modules/user/types'

import {
  createVerification,
  removeVerification,
  getVerification,
} from '../documents/email_verifications'

export async function sendVerificationEmail({
  user,
  email,
  apiUrl,
  returnUrl,
}: {
  user: UserTypes.User
  email: string
  apiUrl: string
  returnUrl: string
}) {
  const token = await createVerification(user.id, email)
  const verificationURL = `${apiUrl}/email/verify?verificationToken=${token}&returnUrl=${encodeURIComponent(
    returnUrl,
  )}`

  mailgunSendVerificationEmail(user, email, verificationURL, user.name)
  emailLogger('sendVerificationEmail', { userId: user.id }).info(
    `Sent verification request. email ${user.email}, userId: ${user.id}`,
    { user, email },
  )
}

export async function checkVerification(
  token: string,
  req: Request,
): Promise<User | undefined> {
  const verification = await getVerification(token)

  if (verification) {
    const userId = verification.userId

    await updateUser(userId, { email: verification.email, emailVerified: true })
    await removeVerification(token)

    const user = await getUserById(verification.userId)

    if (!user) {
      return undefined
    }

    // Update FT that user has verified their email
    publishCustomFastTrackEvent({
      notificationType: 'Email_Verified',
      userId: verification.userId,
      request: req,
      data: {
        email_verified: true,
      },
    })

    emailLogger('checkVerification', { userId: user.id }).info(
      `Verified users email. email ${user.email}, userId: ${user.id}`,
      { user },
    )

    updateIntercomContact(verification.userId)
    recordStats(user, [{ key: 'emailVerify', amount: 1 }])

    return user
  }

  return undefined
}
