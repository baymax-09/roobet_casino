import { getUserByEmail } from 'src/modules/user/documents/user'
import { sendRecoveryEmail } from 'src/vendors/mailgun'
import { acquireLockWithoutLockout } from 'src/util/named-lock'

import { generateRecoveryToken } from 'src/modules/auth'
import { authLogger } from './logger'

export const doRecovery = async (email: string) => {
  try {
    await acquireLockWithoutLockout([email, 'recovery'], 1000 * 60 * 5)
  } catch {
    return { success: true }
  }

  const token = await generateRecoveryToken(email)
  const doRecoveryLogger = authLogger('doRecovery', { userId: null })
  if (!token) {
    doRecoveryLogger.info('No recovery token found', { email })
    return { success: true }
  }

  doRecoveryLogger.info('Sending recovery email', { email })
  const user = await getUserByEmail(email)
  if (user) {
    await sendRecoveryEmail(user, email, token)
  }
}
