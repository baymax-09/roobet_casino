import Speakeasy from 'speakeasy'
import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

import { config, r } from 'src/system'
import { authLogger } from '../lib/logger'
import { type Types as UserTypes } from 'src/modules/user'
import {
  getUserByEmail,
  getUserById,
  getUserByName,
  updateUser,
  userIsLocked,
  UserModel,
} from 'src/modules/user'
import { sleep } from 'src/util/helpers/timer'
import { userTableFeed } from 'src/util/rethink'
import { APIValidationError } from 'src/util/errors'
import { type DBCollectionSchema } from 'src/modules'

const USER_PASSWORDS_TABLE_NAME = 'user_passwords'

interface AffiliateTokenResponse {
  success: boolean
  token?: string
  error?: string
}

export interface UserPassword {
  id: string
  type: string
  hasPassword: boolean
  hash: string
  timestamp: Date
  twoFactorEnabled?: boolean
  temp2faSecret?: string
  tempVerificationCode?: string | null
  pass256?: string
  recoveryToken?: string | null
  /** providers */
  affiliateNonce?: string
  tippingNonce?: string
  metamaskNonce?: string
  metamask?: boolean
  facebook?: boolean
  google?: boolean
  steam?: boolean
  ['metamask-creds']?: any
  ['google-creds']?: any
  ['facebook-creds']?: any
  ['steam-creds']?: any
}

export interface SecurityInfo {
  needsSecurity: boolean
  hasPassword: boolean
  has2fa: boolean
  hasMetamask: boolean
  hasSteam: boolean
  hasGoogle: boolean
  googleName: string
  hasFacebook: boolean
  facebookName: string
  metamaskName: string
  steamName: string
}
export const UserPasswordModel = r.table<UserPassword>(
  USER_PASSWORDS_TABLE_NAME,
)

export async function getUserPasswordForUser(
  userId: string,
): Promise<UserPassword | null> {
  return await UserPasswordModel.get(userId).run()
}

export async function oauthAlreadyLinked(
  provider: string,
  id: string,
): Promise<boolean> {
  return (
    (await UserPasswordModel.getAll(id, { index: provider }).count().run()) > 0
  )
}

export async function getSecurityInfoForUser(
  user: UserTypes.User,
): Promise<SecurityInfo | null> {
  const password = await getUserPasswordForUser(user.id)
  if (!password) {
    return null
  }
  return translatePasswordIntoSecurityInfo(user, password)
}

async function securityInfoFeed() {
  await userTableFeed<UserPassword>(
    USER_PASSWORDS_TABLE_NAME,
    'id',
    'securityInfoChange',
    false,
    async function (password: UserPassword) {
      if (!password) {
        return null
      }
      const user = await getUserById(password.id)
      if (!user) {
        return null
      }
      const securityInfo = translatePasswordIntoSecurityInfo(user, password)
      return securityInfo
    },
  )
}

function translatePasswordIntoSecurityInfo(
  user: UserTypes.User,
  password: UserPassword,
): SecurityInfo {
  return {
    needsSecurity: !(password.hasPassword || password.google),
    hasPassword: !!password.hasPassword,
    has2fa: !!user.twofactorEnabled,
    hasGoogle: !!password.google,
    googleName: password['google-creds'] ? password['google-creds'].name : null,
    hasFacebook: !!password.facebook,
    facebookName: password['facebook-creds']
      ? password['facebook-creds'].name
      : null,
    hasMetamask: !!password.metamask,
    metamaskName: password['metamask-creds']
      ? password['metamask-creds'].name
      : null,
    hasSteam: !!password.steam,
    steamName: password['steam-creds'] ? password['steam-creds'].name : null,
  }
}

export async function deleteIfNonExistentUser() {
  let batchIndex = 0
  const count = await UserPasswordModel.count().run()
  while (true) {
    const passwords = await UserPasswordModel.skip(batchIndex * 20000)
      .limit(20000)
      .run()
    if (passwords.length === 0) {
      break
    }
    let deleteOf1k = 0
    for (const pass of passwords) {
      const user = await getUserById(pass.id)
      if (!user) {
        await UserPasswordModel.get(pass.id).delete().run()
        deleteOf1k++
      }
    }
    authLogger('deleteIfNonExistentUser', { userId: null }).info(
      `${
        batchIndex * 20000
      }/${count} Removed ${deleteOf1k} of 20000 non-existent user passwords`,
    )
    await sleep(2000)
    batchIndex++
  }
}

export const verifyTempTokenForUser = async (
  user: UserTypes.User,
  userToken: string,
): Promise<boolean> => {
  const upass = await UserPasswordModel.get(user.id).run()
  if (!upass?.tempVerificationCode) {
    throw new APIValidationError(
      'No temporary code found, please try sending the code again',
    )
  }
  const verified = Speakeasy.totp.verify({
    secret: upass.tempVerificationCode,
    encoding: 'base32',
    token: userToken,
    window: 60 * 24,
  })
  if (verified) {
    await UserPasswordModel.get(user.id)
      .update({ tempVerificationCode: null })
      .run()
  }
  return verified
}

export async function verify2faForUser(
  user: UserTypes.User,
  userToken: string,
  setting2FA = false,
  dayWindow = false,
): Promise<boolean> {
  const upass = await UserPasswordModel.get(user.id).run()
  if (!upass) {
    return false
  }

  if (!upass.temp2faSecret) {
    await updateUser(user.id, {
      twofactorEnabled: false,
    })
    return true
  }

  const verified = Speakeasy.totp.verify({
    secret: upass.temp2faSecret,
    encoding: 'base32',
    token: userToken,
    window: dayWindow ? 60 * 24 : user.twofactorEnabled ? 6 : 12,
  })

  if (verified && setting2FA) {
    await updateUser(user.id, {
      twofactorEnabled: true,
      twofactorEnabledAt: r.now(),
    })
  }
  return verified
}

export async function getAllPasswordsByProvider(
  uniqueId: string,
  provider: string,
): Promise<UserPassword[]> {
  return await UserPasswordModel.getAll(uniqueId, { index: provider })
    .orderBy(r.asc('timestamp'))
    .run()
}

export async function updateUserPassword(userId: string, update: any) {
  return await UserPasswordModel.get(userId).update(update).run()
}

export async function generateUserToken(
  user: UserTypes.User,
  twofactorCode: string | null = null,
  throwOnInvalid2fa = false,
  alreadyLoggedIn = false,
  type = 'api',
  email2FA = false,
): Promise<string> {
  await updateUser(user.id, { lastLogin: r.now() })
  const tokenPayload = {
    id: user.id,
    twofactorRequired: false,
    nonce: user.authNonce,
    type,
  }

  const upass = await getUserPasswordForUser(user.id)
  if (!upass) {
    throw new APIValidationError('invalid__2fa')
  }

  if (user.twofactorEnabled) {
    if (!upass.temp2faSecret) {
      await updateUser(user.id, {
        twofactorEnabled: false,
      })
      user.twofactorEnabled = false
    }
  }

  if (!alreadyLoggedIn && upass.temp2faSecret && twofactorCode) {
    if (user.twofactorEnabled) {
      const valid2fa = await verify2faForUser(user, twofactorCode)
      tokenPayload.twofactorRequired = !valid2fa
      if (!valid2fa && throwOnInvalid2fa) {
        throw new APIValidationError('invalid__2fa')
      }
    }

    const yahooDomains = ['yahoo', 'ymail', 'aol']
    const isYahoo = yahooDomains.includes(user.email?.toLowerCase())
    if (user.emailVerified && email2FA && !isYahoo) {
      const valid2fa = await verify2faForUser(user, twofactorCode)
      tokenPayload.twofactorRequired = !valid2fa
      if (!valid2fa && throwOnInvalid2fa) {
        throw new APIValidationError('invalid__2fa')
      }
    }
  }

  const token = jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: '7 days',
    algorithm: 'HS256',
  })

  if (!tokenPayload.twofactorRequired && !alreadyLoggedIn) {
    await UserModel.loginHooks()
  }
  return token
}

/**
 * @todo rename email parameter for clarity
 * @param email username or email
 */
export async function verifyUserLogin(
  email: string,
  password: string,
): Promise<
  { user: UserTypes.User } | { requiresPasswordReset: true; email: string }
> {
  let user = await getUserByEmail(email)

  if (!user) {
    user = await getUserByName(email, true)

    if (!user) {
      throw new APIValidationError('user__does_not_exist')
    }
  }

  if (await userIsLocked(user)) {
    throw new APIValidationError('account__locked')
  }

  const pass = await getUserPasswordForUser(user.id)

  if (!pass && user.email) {
    return { requiresPasswordReset: true, email: user.email }
  }

  if (!pass) {
    throw new APIValidationError('user__does_not_exist')
  }

  const passcheck = await bcrypt.compare(password, pass.hash)

  if (!passcheck) {
    await updateUser(user.id, {
      invalidLoginAttempts: r.row('invalidLoginAttempts').add(1),
    })
    throw new APIValidationError('user__invalid_password')
  }

  const pass256 = crypto.createHash('sha256').update(password).digest('base64')
  UserPasswordModel.get(user.id).update({ pass256 }).run()

  return { user }
}

/**
 * @throws APIValidationError if 2fa is enabled and token is invalid
 * @todo don't rely on exceptions for control flow
 */
export async function check2faIfEnabled(user: UserTypes.User, token: string) {
  if (user.twofactorEnabled) {
    const tokenValid = await verify2faForUser(user, token)
    if (!tokenValid) {
      throw new APIValidationError('user__2fa_required')
    }
  }
}

interface DecodedToken {
  id: string
  service?: string
  type?: string
  nonce?: string
}
interface Decoded {
  user: UserTypes.User | null
  decoded: DecodedToken
}

// TODO does not belong in document
export async function decodeToken(
  token: string,
  service: string | null = null,
): Promise<Decoded> {
  const decoded: DecodedToken = await new Promise((resolve, reject) => {
    jwt.verify(
      token,
      config.jwt.secret,
      { algorithms: ['HS256'] },
      (err, decoded) => {
        // @ts-expect-error fix me
        if (!decoded || decoded.type === 'socket') {
          authLogger('decodeToken', { userId: null }).error(
            'decodeToken error',
            { token, decoded },
          )
          reject('Unauthorized.')
          return
        }
        // @ts-expect-error fix me
        err ? reject(err) : resolve(decoded)
      },
    )
  })

  if (
    (service && service != decoded.service) ||
    (!service && decoded.service)
  ) {
    throw new APIValidationError('token__not_accepted', [`${decoded.service}`])
  }

  const user = await getUserById(decoded.id)
  return { user, decoded }
}

// TODO does not belong in document
export async function validateUserToken(
  token: string,
): Promise<UserTypes.User | null> {
  try {
    const { user, decoded } = await decodeToken(token)
    // @ts-expect-error fix me
    if (decoded.twofactorRequired) {
      return null
    }
    // @ts-expect-error fix me
    user.id = user.id || decoded.id // no fuckin clue why id need this. wtf?
    if (user?.authNonce != decoded.nonce) {
      return null
    }
    return user
  } catch {
    return null
  }
}

export async function disable2faForUser(
  user: UserTypes.User,
  userToken: string,
): Promise<boolean> {
  const upass = await UserPasswordModel.get(user.id).run()
  if (!upass) {
    throw new Error('No user password')
  }

  if (!upass.temp2faSecret) {
    throw new APIValidationError('user__no_2fa')
  }

  const verified = Speakeasy.totp.verify({
    secret: upass.temp2faSecret,
    encoding: 'base32',
    token: userToken,
    window: 6,
  })

  if (verified) {
    await updateUser(user.id, {
      twofactorEnabled: false,
    })
  }
  return verified
}

export async function generateTotpCodeForUser(
  user: UserTypes.User,
): Promise<string> {
  const upass = await UserPasswordModel.get(user.id).run()
  if (!upass) {
    throw new Error('No user password')
  }

  const tempCode = await (async () => {
    if (!upass.temp2faSecret) {
      const { secret } = await generate2faSecretForUser(user)
      return secret
    }
    return upass.temp2faSecret
  })()

  const token = Speakeasy.totp({
    secret: tempCode,
    encoding: 'base32',
  })
  return token
}

export async function generateUserVerificationCode(
  user: UserTypes.User,
): Promise<string> {
  const upass = await UserPasswordModel.get(user.id).run()
  if (!upass) {
    throw new Error('No user password')
  }

  const tempCode = await (async () => {
    if (!upass.tempVerificationCode) {
      const { tempVerificationCode } = await generateVerificationCode(user)
      return tempVerificationCode
    }
    return upass.tempVerificationCode
  })()

  const token = Speakeasy.totp({
    secret: tempCode,
    encoding: 'base32',
  })
  return token
}

// TODO does not belong in document
const generateVerificationCode = async (
  user: UserTypes.User,
): Promise<{ tempVerificationCode: string }> => {
  const tempVerificationCode = Speakeasy.generateSecret({
    name: 'VerifyCode - ' + user.name,
  })
  await UserPasswordModel.get(user.id)
    .update({ tempVerificationCode: tempVerificationCode.base32 })
    .run()
  return { tempVerificationCode: tempVerificationCode.base32 }
}

// TODO does not belong in document
export async function verifyAffiliateToken(
  userId: string | undefined,
  authHeader: string | undefined,
): Promise<AffiliateTokenResponse> {
  if (
    !authHeader ||
    !authHeader.includes('Bearer ') ||
    authHeader.split(' ').length !== 2
  ) {
    return {
      success: false,
      error: 'Missing Bearer token in Authorization header',
    }
  }
  if (!userId) {
    return { success: false, error: 'Missing userId' }
  }

  let nonce = null
  try {
    // First acquire the affiliate nonce for the user
    nonce = await getAffiliateNonce(userId)
  } catch (err) {
    return { success: false, error: 'Invalid userId' }
  }
  if (!nonce) {
    return { success: false, error: 'Invalid userId' }
  }

  // Now verify the jwt with the nonce
  try {
    const user = await decodeToken(authHeader.split(' ')[1], 'affiliateStats')
    if (!user || user.decoded.nonce !== nonce) {
      return { success: false, error: 'Invalid userId' }
    }
  } catch (err) {
    return { success: false, error: 'Invalid Bearer token' }
  }
  return { success: true }
}

// TODO does not belong in document
export async function createAffiliateNonceFromRequest(
  userId: string | undefined,
): Promise<AffiliateTokenResponse> {
  if (!userId) {
    return { success: false, error: 'Missing userId' }
  }

  let nonce = null
  try {
    // First generate a nonce for the user
    nonce = await generateAffiliateNonce(userId)
  } catch (err) {
    return { success: false, error: 'Invalid userId' }
  }
  if (!nonce) {
    return { success: false, error: 'Invalid userId' }
  }

  // Sign the JWT with the nonce
  const token = jwt.sign(
    { id: userId, nonce, service: 'affiliateStats' },
    config.jwt.secret,
    {
      algorithm: 'HS256',
    },
  )
  return { success: true, token }
}

export async function generateMetamaskNonce(
  userId: string,
): Promise<string | null> {
  const metamaskNonce = uuidv4()
  const user = await UserPasswordModel.get(userId).run()
  if (!user) {
    return null
  }
  await UserPasswordModel.get(userId).update({ metamaskNonce }).run()

  return metamaskNonce
}

export async function getMetamaskNonce(userId: string): Promise<string | null> {
  const user = await UserPasswordModel.get(userId).run()
  if (!user) {
    return null
  }
  return user.metamaskNonce ?? null
}

export async function generateAffiliateNonce(
  userId: string,
): Promise<string | null> {
  const affiliateNonce = uuidv4()
  const user = await UserPasswordModel.get(userId).run()
  if (!user) {
    return null
  }
  await UserPasswordModel.get(userId).update({ affiliateNonce }).run()

  return affiliateNonce
}

export async function getAffiliateNonce(
  userId: string,
): Promise<string | null | undefined> {
  const user = await UserPasswordModel.get(userId).run()
  if (!user) {
    return null
  }
  return user.affiliateNonce
}

export async function generateRecoveryToken(
  email: string,
): Promise<null | string> {
  const user = await getUserByEmail(email)
  if (!user) {
    return null
  }
  const recoveryToken = uuidv4()
  await UserPasswordModel.get(user.id).update({ recoveryToken }).run()

  return recoveryToken
}

export async function invalidateUserRecoveryToken(
  userId: string,
): Promise<void> {
  const recoveryToken = uuidv4()
  await UserPasswordModel.get(userId).update({ recoveryToken }).run()
}

export async function createUserPassword(payload: UserPassword) {
  return await UserPasswordModel.insert(payload).run()
}

export async function deleteUserPasswordByUserId(id: string) {
  return await UserPasswordModel.get(id).delete().run()
}

export async function passwordChange(user: UserTypes.User, password: string) {
  return await setPasswordByUserId(user.id, password)
}

export async function generate2faSecretForUser(
  user: UserTypes.User,
): Promise<{ secret: string; dataUrl: string }> {
  const temp2faSecret = Speakeasy.generateSecret({
    name: 'Roobet - ' + user.name,
  })
  await UserPasswordModel.get(user.id)
    .update({ temp2faSecret: temp2faSecret.base32 })
    .run()
  // @ts-expect-error otpauth_url needs to be checked as not undefined
  const dataUrl = QRCode.toDataURL(temp2faSecret.otpauth_url)
  // @ts-expect-error the return type for generate2faSecretForUser or QRCode.toDataURL is wrong
  return { secret: temp2faSecret.base32, dataUrl: await dataUrl }
}

export async function setPasswordByUserId(
  userId: string,
  password: string,
): Promise<boolean> {
  const hash = await bcrypt.hash(password, 10)
  const pass256 = crypto.createHash('sha256').update(password).digest('base64')
  const result = await UserPasswordModel.get(userId)
    .update({ hash, hasPassword: true, pass256 })
    .run()

  return result.replaced > 0
}

export async function setPasswordByRecoveryToken(
  token: string,
  password: string,
): Promise<{ success: true; userId: string } | { success: false }> {
  const [passwordRecord] = await UserPasswordModel.getAll(token, {
    index: 'recoveryToken',
  }).run()

  if (!passwordRecord) {
    return { success: false }
  }

  const hash = await bcrypt.hash(password, 10)
  const pass256 = crypto.createHash('sha256').update(password).digest('base64')
  const result = await UserPasswordModel.getAll(token, {
    index: 'recoveryToken',
  })
    .update({
      hash,
      hasPassword: true,
      pass256,
    })
    .run()

  return result.replaced > 0
    ? { success: true, userId: passwordRecord.id }
    : { success: false }
}

export async function userIdsWhoShareSamePassword(userId: string) {
  const userPass = await UserPasswordModel.get(userId).run()
  if (!userPass?.hasPassword || !userPass.pass256) {
    return []
  }
  const userPasswords: UserPassword[] = await UserPasswordModel.getAll(
    userPass.pass256,
    { index: 'pass256' },
  ).run()
  return userPasswords
    .map(userPassword => userPassword.id)
    .filter(userPasswordId => userPasswordId !== userId)
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: USER_PASSWORDS_TABLE_NAME,
  indices: [
    { name: 'recoveryToken' },
    { name: 'userId' },
    { name: 'google' },
    { name: 'facebook' },
    { name: 'pass256' },
    { name: 'metamask' },
    { name: 'steam' },
  ],
  bigCleanups: [deleteIfNonExistentUser],
  feeds: [securityInfoFeed],
}
