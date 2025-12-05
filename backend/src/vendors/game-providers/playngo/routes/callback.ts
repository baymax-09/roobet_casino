import express from 'express'
import xmlResponse from 'xml'
import xmlBodyparser from 'express-xml-bodyparser'

import { config } from 'src/system'
import { type Types as UserTypes, userIsLocked } from 'src/modules/user'
import { type Router, api } from 'src/util/api'
import { getSelectedBalanceFromUser } from 'src/modules/user/balance'
import {
  currencyExchange,
  getUserSelectedDisplayCurrency,
} from 'src/modules/currency/lib/currencyFormat'

import {
  processCancelReserve,
  processReserve,
  processRelease,
} from '../lib/transactions'
import { makeResponseFromObject } from '../lib/response'
import { transactionalProcess } from '../documents/transactions'
import {
  validateAccessToken,
  getUserFromExternalId,
  generateAuthToken,
  getUserFromAuthToken,
} from '../lib/auth'
import { convertBalance, convertTsToDate } from '../lib/utils'
import { RequestExtractor } from '../lib'
import { StatusCodes } from '../lib/enums'
import { bannedCountries } from '../lib/bannedCountries'
import {
  createPNGId,
  getDisplayCurrencyFromRequest,
  displayCurrencyToCurrencyCode,
} from '../lib/currencies'
import { playngoLogger } from '../lib/logger'

const asyncCallback = api.scopedAsyncCallback(playngoLogger)

function respondWithXml(res: express.Response, result: any) {
  const response = xmlResponse(result)
  res.set('Content-Type', 'text/xml')
  res.send(response)
}

export default function (app: Router) {
  const router = express.Router()
  app.use('/callback', router)

  router.use(xmlBodyparser())

  router.post(
    '/authenticate',
    asyncCallback(async (req, res, _, logger) => {
      const extractedRequest = RequestExtractor.authenticate(req.body)
      if (!validateAccessToken(extractedRequest.accesstoken)) {
        const responsePayload = makeResponseFromObject('authenticate', {
          statusCode: StatusCodes.WRONGUSERNAMEPASSWORD,
        })
        logger.info('WRONGUSERNAMEPASSWORD', {
          extractedRequest,
        })
        respondWithXml(res, { authenticate: responsePayload })
        return
      }

      let user: UserTypes.User | null = null
      let responsePayload
      try {
        const sessionToken = extractedRequest.username
        user = await getUserFromAuthToken(sessionToken)
        if (!user || (await userIsLocked(user))) {
          responsePayload = makeResponseFromObject('authenticate', {
            statusCode: StatusCodes.ACCOUNTLOCKED,
            statusMessage: 'Account locked.',
          })
        } else {
          const token = generateAuthToken(user, false)

          const balanceReturn = await getSelectedBalanceFromUser({ user })
          const isBannedCountry = bannedCountries.includes(user.countryCode)
          const displayCurrency = await getUserSelectedDisplayCurrency(user.id)
          const PNGDisplayCurrency =
            displayCurrencyToCurrencyCode(displayCurrency)
          const displayBalance = await currencyExchange(
            balanceReturn.balance,
            displayCurrency,
            true,
          )
          responsePayload = makeResponseFromObject('authenticate', {
            externalId: createPNGId(user.id, displayCurrency),
            statusCode: StatusCodes.OK,
            userCurrency: PNGDisplayCurrency,
            nickname: user.name,
            country: isBannedCountry
              ? config.overrideCountryCode
              : user.countryCode,
            birthdate: '1990-01-02',
            registration: convertTsToDate(user.createdAt),
            real: convertBalance(displayBalance),
            externalGameSessionId: token,
          })
        }
      } catch (error) {
        logger.error('error', error)
        responsePayload = makeResponseFromObject('authenticate', {
          statusCode: StatusCodes.WRONGUSERNAMEPASSWORD,
          statusMessage: 'Wrong username or password.',
        })
      }
      respondWithXml(res, { authenticate: responsePayload })
    }),
  )

  router.post(
    '/balance',
    asyncCallback(async (req, res, _, logger) => {
      const extractedRequest = RequestExtractor.balance(req.body)
      if (!validateAccessToken(extractedRequest.accesstoken)) {
        const responsePayload = makeResponseFromObject('balance', {
          statusCode: StatusCodes.WRONGUSERNAMEPASSWORD,
        })
        respondWithXml(res, { balance: responsePayload })
        return
      }

      const requestCurrency = getDisplayCurrencyFromRequest(extractedRequest)
      if (!requestCurrency) {
        const responsePayload = makeResponseFromObject('balance', {
          statusCode: StatusCodes.INVALIDCURRENCY,
        })
        logger.error('[requestCurrency]', {
          request: extractedRequest,
        })
        respondWithXml(res, { balance: responsePayload })
        return
      }

      let user: UserTypes.User | null = null
      try {
        const sessionToken = extractedRequest.externalgamesessionid
        user = await getUserFromAuthToken(sessionToken)
        if (!user) {
          const responsePayload = makeResponseFromObject('balance', {
            statusCode: StatusCodes.WRONGUSERNAMEPASSWORD,
          })
          respondWithXml(res, { balance: responsePayload })
          return
        }
      } catch (error) {
        const responsePayload = makeResponseFromObject('balance', {
          statusCode: StatusCodes.WRONGUSERNAMEPASSWORD,
        })
        respondWithXml(res, { balance: responsePayload })
        return
      }

      let responsePayload
      if (await userIsLocked(user)) {
        responsePayload = makeResponseFromObject('balance', {
          statusCode: StatusCodes.ACCOUNTLOCKED,
        })
      } else if (user) {
        const balanceReturn = await getSelectedBalanceFromUser({ user })
        const displayBalance = await currencyExchange(
          balanceReturn.balance,
          requestCurrency,
          true,
        )
        responsePayload = makeResponseFromObject('balance', {
          statusCode: StatusCodes.OK,
          real: convertBalance(displayBalance),
        })
      } else {
        responsePayload = makeResponseFromObject('balance', {
          statusCode: StatusCodes.NOUSER,
          real: '0.00',
        })
      }
      respondWithXml(res, { balance: responsePayload })
    }),
  )

  router.post(
    '/reserve',
    asyncCallback(async (req, res, _, logger) => {
      const extractedRequest = RequestExtractor.reserve(req.body)
      let user: UserTypes.User | null = null
      try {
        const sessionToken = extractedRequest.externalgamesessionid
        user = await getUserFromAuthToken(sessionToken)
      } catch (error) {
        logger.error('Invalid token', {}, error)
        const responsePayload = makeResponseFromObject('reserve', {
          statusCode: StatusCodes.WRONGUSERNAMEPASSWORD,
        })
        respondWithXml(res, { reserve: responsePayload })
        return
      }

      if (!user) {
        const responsePayload = makeResponseFromObject('reserve', {
          statusCode: StatusCodes.NOUSER,
        })
        respondWithXml(res, { reserve: responsePayload })
        return
      }

      if (await userIsLocked(user)) {
        const responsePayload = makeResponseFromObject('reserve', {
          statusCode: StatusCodes.ACCOUNTLOCKED,
        })
        respondWithXml(res, { reserve: responsePayload })
        return
      }

      if (!validateAccessToken(extractedRequest.accesstoken)) {
        const responsePayload = makeResponseFromObject('reserve', {
          statusCode: StatusCodes.WRONGUSERNAMEPASSWORD,
        })
        respondWithXml(res, { reserve: responsePayload })
        return
      }

      const reserveCurrency = getDisplayCurrencyFromRequest(extractedRequest)

      if (!reserveCurrency) {
        const responsePayload = makeResponseFromObject('reserve', {
          statusCode: StatusCodes.INVALIDCURRENCY,
        })
        logger.error('[reserveCurrency]', {
          request: extractedRequest,
        })
        respondWithXml(res, { reserve: responsePayload })
        return
      }

      const response = await transactionalProcess(
        'reserve',
        user,
        extractedRequest,
        processReserve,
        false,
      )

      const responsePayload = makeResponseFromObject('reserve', response)
      respondWithXml(res, { reserve: responsePayload })
    }),
  )

  router.post(
    '/cancelReserve',
    asyncCallback(async (req, res, _, logger) => {
      const extractedRequest = RequestExtractor.cancelReserve(req.body)
      if (!validateAccessToken(extractedRequest.accesstoken)) {
        const responsePayload = makeResponseFromObject('cancelReserve', {
          statusCode: StatusCodes.WRONGUSERNAMEPASSWORD,
        })
        respondWithXml(res, { cancelReserve: responsePayload })
        return
      }

      const user = await getUserFromExternalId(extractedRequest.externalid)
      if (!user) {
        const responsePayload = makeResponseFromObject('cancelReserve', {
          statusCode: StatusCodes.NOUSER,
        })
        respondWithXml(res, { cancelReserve: responsePayload })
        return
      }
      const refundCurrency = getDisplayCurrencyFromRequest(extractedRequest)

      if (!refundCurrency) {
        const responsePayload = makeResponseFromObject('cancelReserve', {
          statusCode: StatusCodes.INVALIDCURRENCY,
        })
        logger.error('[requestCurrency]', {
          request: extractedRequest,
        })
        respondWithXml(res, { cancelReserve: responsePayload })
        return
      }

      const response = await transactionalProcess(
        'cancelReserve',
        user,
        extractedRequest,
        processCancelReserve,
        true,
      )
      const responsePayload = makeResponseFromObject('cancelReserve', response)

      respondWithXml(res, { cancelReserve: responsePayload })
    }),
  )

  router.post(
    '/release',
    asyncCallback(async (req, res, _, logger) => {
      const extractedRequest = RequestExtractor.release(req.body)
      if (!validateAccessToken(extractedRequest.accesstoken)) {
        const responsePayload = makeResponseFromObject('release', {
          statusCode: StatusCodes.WRONGUSERNAMEPASSWORD,
        })
        respondWithXml(res, { release: responsePayload })
        return
      }
      let user: UserTypes.User | null = null
      try {
        const sessionToken = extractedRequest.externalgamesessionid
        user = await getUserFromAuthToken(sessionToken)
      } catch {
        const responsePayload = makeResponseFromObject('release', {
          statusCode: StatusCodes.WRONGUSERNAMEPASSWORD,
        })
        respondWithXml(res, { release: responsePayload })
        return
      }

      if (!user) {
        const responsePayload = makeResponseFromObject('release', {
          statusCode: StatusCodes.NOUSER,
        })
        respondWithXml(res, { release: responsePayload })
        return
      }

      const releaseCurrency = getDisplayCurrencyFromRequest(extractedRequest)

      if (!releaseCurrency) {
        const responsePayload = makeResponseFromObject('release', {
          statusCode: StatusCodes.INVALIDCURRENCY,
        })
        logger.error('[requestCurrency]', {
          request: extractedRequest,
        })
        respondWithXml(res, { release: responsePayload })
        return
      }

      const response = await transactionalProcess(
        'release',
        user,
        extractedRequest,
        processRelease,
        false,
      )

      const responsePayload = makeResponseFromObject('release', response)
      respondWithXml(res, { release: responsePayload })
    }),
  )
}
