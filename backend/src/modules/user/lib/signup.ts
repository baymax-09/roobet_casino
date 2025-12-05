import { v4 as uuidv4 } from 'uuid'

import { countAllByCode } from 'src/modules/promo/documents/promo_code'
import { APIValidationError } from 'src/util/errors'
import { findArchiveUserByName } from 'src/modules/user/documents/archive'
import { assessRisk, RiskStatus } from 'src/modules/fraud/riskAssessment'
import { isEmailDeliverable } from 'src/vendors/mailgun'
import { config } from 'src/system'
import { deleteUserPasswordByUserId, isPasswordValid } from 'src/modules/auth'

import {
  createUserFromSignup,
  getUserByEmail,
  getUserByName,
  postSignUpHooks,
  deleteUser,
} from '../documents/user'
import { userLogger } from './logger'

export type SignupOptions = Partial<{
  dob: false | string
  freeBalance: boolean
  mustSetName: boolean
  r: any
  locale: string | null
  apiUrl: string
  returnUrl: string
}>

interface SignupArgs {
  username: string
  email: string
  password: string
  countryCode: string
  session: { id: string; data: string }
  ip: string
  opts?: SignupOptions
}

export async function initUserSignup({
  username,
  email,
  password,
  countryCode,
  session,
  ip,
  opts,
}: SignupArgs) {
  email = email || ''
  password = password || ''
  username = username
    .replace(/<(?:.|\n)*?>/gm, '')
    .replace(/\W/g, '')
    .trim()
  username = username.replace(' ', '')

  username = username.slice(0, 15)
  const userWithName = await getUserByName(username, true)
  const archivedUserWithName = await findArchiveUserByName(username)
  const apiUrl = opts?.apiUrl ?? config.appSettings.backendBase
  const returnUrl = opts?.returnUrl ?? config.appSettings.frontendBase

  // generate a temp password for the user if they dont supply one.
  let hasPassword = true
  if (!password || (password && password.length === 0)) {
    hasPassword = false
    password = uuidv4()
  }
  if (!isPasswordValid(password)) {
    throw new APIValidationError('user__password_length', [
      config.minimumPasswordLength.toString(),
    ])
  }
  if (userWithName || archivedUserWithName) {
    throw new APIValidationError('user__already_exists')
  }

  const promoCodesWithName = await countAllByCode(username.toLowerCase())
  if (promoCodesWithName > 0) {
    throw new APIValidationError('user__already_exists')
  }

  // We use the email to determining if the email is disposable by Seon
  const seonValidationEmail = email

  if (email) {
    email = email.toLowerCase()
    const isDeliverable = await isEmailDeliverable(email)
    userLogger('initUserSignup', { userId: null }).info(
      `isDeliverable ${email} ${isDeliverable}`,
      {
        username,
        email,
        countryCode,
        opts,
      },
    )
    if (!isDeliverable) {
      email = ''
    }
  }

  const user = await getUserByEmail(email)
  if (user && email) {
    throw new APIValidationError('user__already_exists_email')
  }

  const newUser = await createUserFromSignup(
    username,
    email,
    password,
    countryCode,
    hasPassword,
    opts,
  )

  if (!newUser) {
    throw new APIValidationError('user__create__failed')
  }

  // We use the email to determining if the email is disposable by Seon
  const fraudResponse = await assessRisk({
    user: { ...newUser, email: seonValidationEmail },
    ip,
    session,
    actionType: 'user_signup',
  })

  if (fraudResponse.state === RiskStatus.DECLINED) {
    await deleteUser(newUser.id)
    await deleteUserPasswordByUserId(newUser?.id)
    throw new APIValidationError(
      fraudResponse?.declineReason ?? 'fraud__check_reject',
    )
  }

  postSignUpHooks({
    user: newUser,
    apiUrl,
    returnUrl,
  })

  return newUser
}
