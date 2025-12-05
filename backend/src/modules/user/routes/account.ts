import express from 'express'
import moment from 'moment'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import path from 'path'

import {
  r,
  config,
  getFrontendDomainFromReq,
  getBackendDomainFromReq,
} from 'src/system'
import * as RateLimiter from 'src/util/rateLimiter'
import { media } from 'src/util/media'
import {
  api,
  type RouterPassport,
  type RouterIO,
  type RoobetReq,
} from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { t } from 'src/util/i18n'
import {
  getSecurityInfoForUser,
  generateUserToken,
  twoFactorCheck,
  getUserPasswordForUser,
} from 'src/modules/auth'
import { setAuthCookies } from 'src/modules/auth/lib'
import { getUserSessionsByUser } from 'src/modules/auth/documents/user_session'
import * as KYC from 'src/modules/fraud/kyc'
import { getSystemSettings } from 'src/modules/userSettings'
import { getUserAccessRules } from 'src/modules/rbac'
import { getMatchPromoForUser } from 'src/modules/promo/documents/match_promo'
import {
  getCountryCodeFromRequest,
  getIpFromRequest,
} from 'src/modules/fraud/geofencing'
import { generateAuthTokenFastrack } from 'src/vendors/fasttrack/lib'
import {
  type CashCurrency,
  getUserSelectedFiatCurrency,
  cashCurrencySymbols,
  DisplayCurrencyList,
} from 'src/modules/currency/types'
import { getCurrencyPairs } from 'src/modules/currency/documents/exchange_rates'

import {
  getPublicUserProfile,
  updateUser,
  getUserByName,
  userIsLocked,
  getUserById,
} from '../'
import { archiveAndDeleteAccount } from '../documents/archive'
import { getMutesByUserId } from '../documents/mutes'
import { nameChange } from '../documents/user'
import {
  recordFingerprint,
  getUsersWithSameFingerprint,
} from '../documents/fingerprint'
import { sendTip } from '../lib/tips'
import { isUsernameValid } from '../lib/username'
import { uploadUserFile } from './../lib/uploadUserFile'
import { type User } from '../types'
import {
  getSelectedBalanceFieldFromIdentifier,
  mapBalanceInformation,
} from '../balance'
import { isValidVerificationDocumentExtension } from '../lib/verification'
import { sessionCookieOptions } from 'src/util/middleware'

export default function (app: express.Router, _: RouterPassport, io: RouterIO) {
  const router = express.Router()
  app.use('/account', router)

  router.post(
    '/uploadDocument',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { override, documentType, hashedFileName } = req.body

      await uploadUserFile({ user, override, documentType, hashedFileName })
    }),
  )

  router.get(
    '/sessions',
    api.check,
    api.validatedApiCall(async (req, res) => {
      const { user } = req as RoobetReq

      const sessions = await getUserSessionsByUser(user.id)
        .sort([
          ['destroyed', 1],
          ['updatedAt', -1],
        ])
        .limit(10)
        .lean()

      res.json({
        sessions: sessions.map(session => {
          const updatedAt = moment(session.updatedAt)
          const elapsed = moment().diff(updatedAt, 'hours')

          return {
            ...session,
            elapsed,
            lastActive:
              elapsed >= 1
                ? updatedAt.format('MM/DD/YYYY hh:mm:ss a')
                : updatedAt.fromNow(),
            signedOnAt: moment(session.createdAt).format('MM/DD/YYYY'),
            active: elapsed > 48 ? false : !session.destroyed,
          }
        }),
      })
    }),
  )

  // This route is for one user to tip another
  router.post(
    '/transfer',
    RateLimiter.basicUserDebounce('account/transfer'),
    api.check,
    twoFactorCheck,
    api.validatedApiCall(async req => {
      const { user: fromUser } = req as RoobetReq
      const { username, amount, note } = req.body
      let { isPrivate } = req.body
      const ip = await getIpFromRequest(req, config.seon.fallbackIPAddress)

      const session = {
        id: req.sessionID,
        data: (req.headers['x-seon-session-payload'] as string) || '',
      }

      if (!username) {
        throw new APIValidationError('user__does_not_exist')
      }

      const toUser = await getUserByName(username, true)
      isPrivate = isPrivate === 'true' || isPrivate === true
      if (!toUser) {
        throw new APIValidationError('user__does_not_exist')
      }

      const amountNum = parseFloat(amount)
      if (amountNum <= 0 || isNaN(amountNum)) {
        throw new APIValidationError('invalid_amount')
      }

      if (amountNum < 0.01) {
        throw new APIValidationError('invalid_amount')
      }

      await sendTip({
        fromUser,
        toUser,
        amount: amountNum,
        isPrivate,
        note,
        ip,
        session,
      })
    }),
  )

  // checks if user exists of profile searching for. If it exists and has an ID, it returns the profile.
  router.get(
    '/publicProfile',
    api.check,
    api.validatedApiCall(async req => {
      const { user: viewingUser } = req as RoobetReq
      const { nameId } = req.query

      if (typeof nameId !== 'string' || !nameId.length) {
        throw new APIValidationError('user__does_not_exist')
      }

      const user = await getUserByName(nameId, true)

      if (!user) {
        throw new APIValidationError('user__does_not_exist')
      }

      return await getPublicUserProfile(viewingUser, user)
    }),
  )

  router.get(
    '/testFingerprint',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      return await getUsersWithSameFingerprint(user.id)
    }),
  )

  router.post(
    '/setName',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      if (!req.body.name) {
        throw new APIValidationError('auth__specify_username')
      }

      if (!isUsernameValid(req.body.name)) {
        throw new APIValidationError('user__name_char')
      }
      await nameChange(user, req.body.name)
    }),
  )

  router.post(
    '/addFingerprint',
    api.validatedApiCall(async req => {
      if (
        req.body.linkedId &&
        req.query.token ===
          'uq3h4ghiuq23rq3kwueth3i4uthq3i4utq3i4t8yq34igyheig8yq34t8yq348t'
      ) {
        const user = await getUserById(req.body.linkedId)
        if (user) {
          recordFingerprint(req.body.linkedId, req.body.visitorId, req.body)
          await updateUser(req.body.linkedId, { lastFingerprint: r.now() })
        }
      }
    }),
  )

  router.post(
    '/deleteAccount',
    api.check,
    api.validatedApiCall(async (req, res) => {
      const { user } = req
      const { password } = req.body
      // Check if hiddenTotalDeposited == 0 and hiddenTotalWithdrawn == 0
      if (!user) {
        throw new APIValidationError('close__account')
      }
      if (!password || typeof password !== 'string') {
        throw new APIValidationError('close__account')
      }
      // If so, let's let them do it
      if (user.hiddenTotalDeposited > 0) {
        throw new APIValidationError('close__account')
      }
      if (user.hiddenTotalWithdrawn > 0) {
        throw new APIValidationError('close__account')
      }
      // Ensure password matches current password
      const currentPassword = await getUserPasswordForUser(user.id)
      if (!currentPassword) {
        throw new APIValidationError('close__account')
      }

      const passwordsMatch = await bcrypt.compare(
        password,
        currentPassword.hash,
      )
      if (passwordsMatch) {
        await archiveAndDeleteAccount(user)
        io.to(user.id).emit('forceRefresh')
        res.status(200).json({ success: true }).send()
        return
      }
      throw new APIValidationError('close__account__invalid__password')
    }),
  )

  router.get(
    '/intercomUpdate',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      await updateUser(user.id, { intercomUpdate: true })
    }),
  )

  router.post(
    '/setLocale',
    api.check,
    api.validatedApiCall(async (req, res) => {
      const { user } = req as RoobetReq
      const { locale } = req.body
      await updateUser(user.id, { locale })
      req.setLocale(locale)
      res.setLocale(locale)
      return true
    }),
  )

  router.post(
    '/setPostback',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { transactionId, transactionSource, subId } = req.body
      if (moment().diff(user.createdAt, 'minutes') < 60) {
        await updateUser(user.id, {
          postback: {
            offerComplete: false,
            transactionId,
            transactionSource,
            subId,
          },
        })
      }
    }),
  )

  // This sets the balance field for the current user (cash or crypto)
  router.post(
    '/setBalanceField',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { balanceField } = req.body
      const selectedBalanceField = getSelectedBalanceFieldFromIdentifier({
        balanceIdentifier: balanceField,
      })
      await updateUser(user.id, { selectedBalanceField })
      return true
    }),
  )

  router.get('/get', api.check, async function (req, res) {
    const {
      user: { id },
    } = req as RoobetReq
    // Expanding the type here because we add arbitrary data to it throughout this function
    const user: (User & Record<string, any>) | null = await getUserById(id)

    if (!user) {
      res.status(401).send(t(user, 'account__locked'))
      return
    }

    if (await userIsLocked(user)) {
      res.status(401).send(t(user, 'account__locked'))
      return
    }

    // If user does not have countryCode, attempt to assign them one
    if (user.countryCode === 'N/A') {
      const countryCode = await getCountryCodeFromRequest(req)
      if (countryCode) {
        await updateUser(user.id, { countryCode })
        user.countryCode = countryCode
      }
    }

    user.balances = await mapBalanceInformation(user)
    user.kyc = await KYC.getKycForUser(user)
    user.systemSettings = await getSystemSettings(user.id)
    user.mode = config.mode
    user.mutes = await getMutesByUserId(user.id)
    if (user.hasMatchPromoActive) {
      user.matchPromo = await getMatchPromoForUser(user.id)
    }
    user.rules = await getUserAccessRules({ user })

    const secret = config.intercom.secret
    const hash = crypto
      .createHmac('sha256', secret)
      .update(user.id)
      .digest('hex')

    user.security = await getSecurityInfoForUser(user)
    user.user_hash = hash
    // @ts-expect-error TODO need to extend express-session type
    req.session.userId = user.id

    const domain = getFrontendDomainFromReq(req)
    const login_secret = config.login_secret
    const login_hash = crypto
      .createHmac('sha256', login_secret)
      .update(user.id)
      .digest('hex')
      .slice(0, 10)

    // user.login_hash = login_hash;
    res.cookie('machineSecret', login_hash, {
      domain,
      httpOnly: true,
      expires: new Date(Date.now() + 86400000 * 30),
    })

    res.cookie('userId', user.id, { maxAge: 30 * 24 * 60 * 60 * 1000, domain })

    // Set session cookie on all subdomains, if not already present.
    // This is support Plink & Sockets which still use the api.{domain} hostname.
    const connectSid = req.cookies['connect.sid']
    const { expires } = req.session.cookie

    const { maxAge, ...cookieOptions } = sessionCookieOptions

    res.cookie('connect.sid', connectSid, {
      ...cookieOptions,
      expires,
      domain,
    })

    const now = moment()
    const createdAt = moment(user.createdAt)
    const createdMinutes = now.diff(createdAt, 'minutes')
    user.newAccount = createdMinutes < 10

    const token = await generateUserToken(user, null, false, true)
    user.socketToken = token
    setAuthCookies(req, res, user)

    const fasttrackToken = generateAuthTokenFastrack(user.id)
    user.fasttrackToken = fasttrackToken

    // Exchange rates.
    const selectedFiat = getUserSelectedFiatCurrency(user)
    const rates = await getCurrencyPairs(DisplayCurrencyList, selectedFiat)

    user.exchangeRates = rates.reduce(
      (rates, rate) => ({
        ...rates,
        [rate.targetCurrency]: {
          rate: rate.exchangeRate,
          symbol: cashCurrencySymbols[rate.targetCurrency],
        },
      }),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {} as Record<CashCurrency, number>,
    )

    res.json({ result: user })
  })

  router.get(
    '/generateS3SignedURL',
    api.check,
    api.validatedApiCall(async (req, res) => {
      const { fileName, prependFileName, userId } = req.query

      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('user__does_not_exist')
      }

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('user__does_not_exist')
      }

      if (typeof fileName !== 'string') {
        throw new APIValidationError('invalid__document')
      }

      if (typeof prependFileName !== 'string') {
        throw new APIValidationError('invalid__document')
      }

      const ext = path.extname(fileName).toLowerCase()

      if (!isValidVerificationDocumentExtension(ext)) {
        throw new APIValidationError('document__upload')
      }

      // Hash file name
      const salt = crypto.randomBytes(16).toString('hex')
      const hash = crypto
        .createHash('sha256')
        .update(fileName + salt)
        .digest('hex')
      const hashedFileName = `${hash}${path.extname(fileName)}`

      const key = `user/${userId}/${prependFileName}-${hashedFileName}`
      const presignedPost = await media.generatePresignedPost(
        'verification',
        key,
      )

      res.json({ ...presignedPost, hashedFileName })
    }),
  )

  router.post(
    '/sessions/sanitize',
    api.validatedApiCall(async (req, res) => {
      // TODO: Remove after all requests are being sent to {domain}/_api
      const xHostHeader = req.headers['x-roobet-host']

      // Only continue if request was sent to subdomain.
      if (typeof xHostHeader === 'string' && xHostHeader?.startsWith('api.')) {
        const domain = getBackendDomainFromReq(req)

        // Clear session cookie on subdomain.
        res.clearCookie('connect.sid', { path: '/', domain })
        res.clearCookie('connect.sid', { path: '/' })

        return { success: true }
      }

      return { success: false }
    }),
  )
}
