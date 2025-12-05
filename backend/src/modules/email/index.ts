import { emailLogger } from './lib/logger'
import { type Types as UserTypes } from 'src/modules/user'

import { sendVerificationEmail } from './lib/verification'

export * as Documents from './documents'
export * as Routes from './routes'

export async function signupHooks({
  user,
  email,
  apiUrl,
  returnUrl,
}: {
  user: UserTypes.User
  email: string
  apiUrl: string
  returnUrl: string
}): Promise<void> {
  if (!email) {
    return
  }

  try {
    await sendVerificationEmail({ user, email, apiUrl, returnUrl })
  } catch (error) {
    emailLogger('signupHooks', { userId: user.id }).error(
      `Failed to send verification email for user: ${
        user.id
      } - ${error.toString()}`,
      { user, email, apiUrl, returnUrl },
      error,
    )
  }
}

export const Email = { sendVerificationEmail, signupHooks }
