import express from 'express'
import * as EmailValidator from 'email-validator'

import { getBackendUrlFromReq, getFrontendUrlFromReq, config } from 'src/system'
import { sessionStore } from 'src/util/store'
import {
  api,
  type RouterApp,
  type RouterPassport,
  type RouterIO,
  type RoobetReq,
} from 'src/util/api'
import { updateUserEmail } from 'src/modules/user/documents/user'
import {
  getUserById,
  userExistsByName,
  isUsernameValid,
} from 'src/modules/user'
import { APIValidationError } from 'src/util/errors'
import { verifyRecaptchaSignup } from 'src/vendors/recaptcha3'
import { sendTwoFactorActivity } from 'src/vendors/mailgun'
import { addNoteToUser } from 'src/modules/admin/documents/user_notes'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'

import {
  passwordChange,
  generateUserToken,
  verify2faForUser,
  disable2faForUser,
  generate2faSecretForUser,
  setPasswordByRecoveryToken,
  invalidateUserRecoveryToken,
  verifyUserLogin,
} from 'src/modules/auth'
import { getUserSessionsByUser } from '../documents/user_session'
import { twoFactorCheck } from '../middleware'
import { setAuthCookies } from '../lib/index'
import { doLogin, loginUser } from '../lib/login'
import { doSignup } from '../lib/signup'
import OAuthRoutes from './oauth'
import { isPasswordValid } from '../lib/password'
import { doRecovery } from '../lib/recovery'
import { authLogger } from '../lib/logger'
import { onLogout } from '../lib/logout'

export default function (
  app: RouterApp,
  passport: RouterPassport,
  io: RouterIO,
) {
  const router = express.Router()
  app.use('/auth', router)

  router.use('/oauth', OAuthRoutes(passport))

  const checkForAutolock: express.RequestHandler = (req, res, next) => {
    if (req.cookies.kycAutolock) {
      res.status(401).send('Account Locked.')
      return
    }
    next()
  }

  // Logout routes.
  router.get('/logout', onLogout())
  router.post('/logout', onLogout())
  router.get('/logoutEverywhere', onLogout(true))

  router.post(
    '/validateUsername',
    checkForAutolock,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { username } = req.body

      if (!username || typeof username !== 'string') {
        throw new APIValidationError('auth__specify_username')
      }

      if (!isUsernameValid(username)) {
        throw new APIValidationError('auth__username_alphanumerics')
      }

      const usernameTaken = await userExistsByName(
        username.trim().toLowerCase(),
      )

      return { usernameTaken }
    }),
  )

  router.post(
    '/signup',
    checkForAutolock,
    countryIsBannedMiddleware,
    api.validatedApiCall(async (req, res) => {
      const { affiliateName, username, password, recaptcha, birthDate } =
        req.body
      let { email } = req.body

      if (!username) {
        throw new APIValidationError('auth__specify_username')
      }

      if (!isUsernameValid(username)) {
        throw new APIValidationError('auth__username_alphanumerics')
      }

      if (!password) {
        throw new APIValidationError('auth__specify_password')
      }

      if (!isPasswordValid(password)) {
        throw new APIValidationError('user__password_length', [
          config.minimumPasswordLength.toString(),
        ])
      }

      const recaptchaResult = await verifyRecaptchaSignup(recaptcha)
      if (!recaptchaResult) {
        throw new APIValidationError('auth__bad_recaptcha')
      }

      if (email) {
        email = email.toLowerCase()
        if (!EmailValidator.validate(email)) {
          throw new APIValidationError('invalid__email')
        }
      }

      await doSignup({
        req,
        res,
        username,
        password,
        email,
        affiliateName,
        birthDate,
      })
      return { token: null }
    }),
  )

  /*
   * user requests 2fa
   * we return a data url
   * the frontend displays it in an img tag
   * user scans it into their authenticator
   */
  router.post(
    '/set2fa',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      if (user.twofactorEnabled) {
        throw new APIValidationError('user__2fa_already_enabled')
      }

      const secret = await generate2faSecretForUser(user)
      return { secret }
    }),
  )

  /*
   * then user puts in 2fa code to verify
   * once they do that, user.2faEnabled will be true and
   * it will be required on login
   */
  router.post(
    '/verify2fa',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { userToken } = req.body
      const success = await verify2faForUser(user, userToken, true)
      if (success) {
        addNoteToUser(user.id, user, 'Enabled 2FA', 'userAction')
        await sendTwoFactorActivity(user, user.email, user.name)
      }
      return { success }
    }),
  )

  router.post(
    '/disable2fa',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { userToken } = req.body
      const success = await disable2faForUser(user, userToken)
      if (success) {
        addNoteToUser(user.id, user, 'Disabled 2FA', 'userAction')
        await sendTwoFactorActivity(user, user.email, user.name)
      }
      return { success }
    }),
  )

  router.post(
    '/setPassword',
    api.check,
    twoFactorCheck,
    api.validatedApiCall(async req => {
      const { user, session } = req as RoobetReq
      const { password } = req.body

      if (!isPasswordValid(password)) {
        throw new APIValidationError('user__password_length', [
          config.minimumPasswordLength.toString(),
        ])
      }

      const didPasswordUpdate = await passwordChange(user, password)
      if (didPasswordUpdate) {
        const sessions = await getUserSessionsByUser(user.id)
          .where('destroyed', false)
          .where({ sessionId: { $ne: session.id } })
          .select('sessionId')

        for (const session of sessions) {
          sessionStore.destroy(session.sessionId)
        }
        addNoteToUser(
          user.id,
          {
            id: 'accountUpdate',
            name: 'Account Update',
            department: 'Compliance',
          },
          'Password Updated',
        )
        io.to(user.id).emit('forceRefresh')
      } else {
        authLogger('auth/setPassword', { userId: user.id }).error(
          'Error updating the user password',
          {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        )
        throw new APIValidationError('user__password_error')
      }
    }),
  )

  router.post(
    '/setEmail',
    api.check,
    api.validatedApiCall(async req => {
      const {
        user,
        body: { email },
      } = req as RoobetReq

      const returnUrl = getFrontendUrlFromReq(req)
      const apiUrl = getBackendUrlFromReq(req)

      return await updateUserEmail({ user, email, returnUrl, apiUrl })
    }),
  )

  router.post(
    '/setName',
    api.check,
    api.validatedApiCall(async () => {
      throw new APIValidationError('auth__name_changes_disabled')
    }),
  )

  /*
   * Generates a user auth token
   * if the user has 2fa required on their account,
   * they must pass in a twofactorToken.
   * If they don't, the token will have 2faRequired which will fail `api.check`
   */
  router.post(
    '/login',
    checkForAutolock,
    countryIsBannedMiddleware,

    api.validatedApiCall(async (req, res) => {
      const { password, twofactorToken, adminLogin, recaptcha } = req.body
      // TODO email is actually email address or username, rename for clarity
      let { email } = req.body

      // To prevent a DOS via our hashing algorithm we limit the length
      if (!password || password.length > 100) {
        throw new APIValidationError('auth__specify_password')
      }

      if (!email) {
        throw new APIValidationError('auth__specify_user_or_email')
      }

      if (!adminLogin) {
        const recaptchaResult = await verifyRecaptchaSignup(recaptcha)
        if (!recaptchaResult) {
          throw new APIValidationError('auth__bad_recaptcha')
        }
      }

      // lowercase email
      email = email.toLowerCase()
      email = email.split(' ').join('')

      const loginResult = await verifyUserLogin(email, password)

      if ('requiresPasswordReset' in loginResult) {
        await doRecovery(loginResult.email)

        return { requiresPasswordReset: true }
      }

      const { user } = loginResult

      return await doLogin({ req, res, user, twofactorToken })
    }),
  )

  router.get(
    '/validate2faForToken',
    api.validatedApiCall(async (req, res) => {
      const { twofactorCode } = req.query
      const validate2fa = req.session.validate2fa

      if (!validate2fa) {
        throw new APIValidationError('auth__try_again')
      }

      const user = await getUserById(validate2fa.userId)
      if (!user) {
        throw new APIValidationError('api__invalid_param', ['Two factor auth'])
      }

      if (
        (typeof twofactorCode !== 'string' && twofactorCode !== undefined) ||
        (typeof twofactorCode === 'string' && twofactorCode.length === 0)
      ) {
        throw new APIValidationError('auth__try_again')
      }

      let emailCheckpoint = false
      if (!user.twofactorEnabled) {
        emailCheckpoint = true
      }

      user.twofactorEnabled = true
      delete req.session.validate2fa
      await generateUserToken(user, twofactorCode, true)
      setAuthCookies(req, res, user)

      if (emailCheckpoint) {
        authLogger('auth/validate2faForToken', { userId: user.id }).info(
          'Verified email checkpoint',
          {
            email: user.email,
          },
        )
      }

      await loginUser(req, user)

      return {}
    }),
  )

  /*
   * User calls /auth/recover
   * We generate a recovery token and store in user_passwords table
   * We send the user to {frontend}/recoverConfirm?token=xyz
   * User types in password + password confirm
   * Frontend sends the token to /auth/recoverConfirm along with the new
   * passwords
   * we return success if it successfully updated the password
   */
  router.post(
    '/recover',
    api.validatedApiCall(async req => {
      let { email } = req.body
      if (!email) {
        throw new APIValidationError('api__missing_param', ['Email'])
      }
      email = email.toLowerCase()
      authLogger('/auth/recover', { userId: null }).info(
        'Recovery email requested',
        { email },
      )
      await doRecovery(email)
    }),
  )

  router.post(
    '/recoverConfirm',
    api.validatedApiCall(async req => {
      const { token, password } = req.body

      if (!password) {
        throw new APIValidationError('auth__specify_password')
      }

      if (password.length < 5) {
        throw new APIValidationError('user__password_length', ['5'])
      }

      if (!token) {
        throw new APIValidationError('auth__invalid_token')
      }

      const result = await setPasswordByRecoveryToken(token, password)

      if (!result.success) {
        throw new APIValidationError('auth__invalid_token')
      }

      // Regenerate the token, thus invalidating the current recovery token
      await invalidateUserRecoveryToken(result.userId)

      // Invalidate all other user sessions
      const sessions = await getUserSessionsByUser(result.userId)
        .where('destroyed', false)
        .select('sessionId')
      for (const session of sessions) {
        sessionStore.destroy(session.sessionId)
      }

      return { success: true }
    }),
  )
}
