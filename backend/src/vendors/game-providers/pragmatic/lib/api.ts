import axios, { type AxiosRequestConfig } from 'axios'

import { config } from 'src/system'
import { getUnixTimeFromDate, addTimeInDuration } from 'src/util/helpers/time'
import { createTransaction } from 'src/modules/user/documents/transaction'
import { getUserById } from 'src/modules/user'
import { type ErrorFreeSpins } from 'src/modules/inventory/documents/types'
import { type FreespinIssuer } from 'src/modules/tp-games'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'

import { pragmaticLogger } from './logger'
import { createFreeSpinUserNotification } from '../../util'
import { calculateAuthHash } from './auth'
import { createFreespins } from '../documents/freespins'
import { createPragId, displayCurrencyToCurrencyCode } from './currencies'
import { type ErrorCode, SeamlessWalletStatusCodes } from './enums'
import { type PragErrorResponse } from './types'

interface CreateVariableFrbArgs {
  userId: string
  rounds: number
  periodOfTime: number
  gameId: string
  betPerRound: number
  frType: string | null
  startDate?: string
  expirationDate?: string
  logTransaction?: boolean
  errorsFreeSpins?: ErrorFreeSpins
  sendNotification?: boolean
  reason: string
  issuerId: FreespinIssuer
}

const basicRequest: AxiosRequestConfig = {
  method: 'post',
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
  },
  responseType: 'json',
}

const jsonRequest: AxiosRequestConfig = {
  method: 'post',
  headers: {
    'content-type': 'application/json',
  },
  responseType: 'json',
}

const ApiPaths = {
  CasinoGameApi: '/CasinoGameAPI',
  FreeRoundsBonusApi: '/FreeRoundsBonusAPI/v2/bonus/player/create/',
  SimpleFreeRoundsApi: '/FreeRoundsBonusAPI/createFRB',
  getSimpleFreeRoundsApi: '/FreeRoundsBonusAPI/getPlayersFRB',
  cancelFreeRoundsApi: '/FreeRoundsBonusAPI/v2/bonus/cancel',
  getBetScalesApi: '/CasinoGameAPI/getBetScales',
}

const getUrl = (subPath: string, path: string) => {
  return `https://${config.pragmatic.apiDomain}/IntegrationService/v3/http${subPath}${path}`
}

export async function getGameUrl(
  gameId: string,
  lang: string,
  token: string,
  userId: string,
  isMobile: string,
  lobbyUrl: string,
  countryCode: string,
  realMode: boolean,
  currency: DisplayCurrency,
) {
  const requestParams = {
    secureLogin: config.pragmatic.secureLogin,
    symbol: gameId,
    language: lang,
    token,
    externalPlayerId: userId,
    country: countryCode,
    currency: displayCurrencyToCurrencyCode(currency),
    technology: 'H5',
    stylename: config.pragmatic.styleName,
    cashierUrl: `${lobbyUrl}/?modal=cashier&tab=deposit`,
    lobbyUrl,
    platform: !isMobile ? 'WEB' : 'MOBILE',
    playMode: realMode ? 'REAL' : 'DEMO',
  }
  const hash = calculateAuthHash(requestParams)
  const qs = new URLSearchParams({
    ...requestParams,
    hash,
  })
  try {
    const response = await axios({
      url: getUrl(ApiPaths.CasinoGameApi, '/game/url'),
      data: qs,
      ...basicRequest,
    })
    return response.data.gameURL
  } catch (error) {
    pragmaticLogger('getGameURL', { userId: null }).error('', {}, error)
    throw error
  }
}

export async function getGames() {
  try {
    const requestParams = {
      secureLogin: config.pragmatic.secureLogin,
      options: 'GetFrbDetails, GetLines',
    }
    const hash = calculateAuthHash(requestParams)
    const qs = new URLSearchParams({
      ...requestParams,
      hash,
    })
    const response = await axios({
      url: getUrl(ApiPaths.CasinoGameApi, '/getCasinoGames'),
      data: qs.toString(),
      ...basicRequest,
    })
    return response.data.gameList
  } catch (error) {
    pragmaticLogger('getGames', { userId: null }).error(
      'error getting games for pragmatic',
      {},
      error,
    )
    throw error
  }
}

export async function cancelFrb(bonusCode: string) {
  const logger = pragmaticLogger('cancelFrb', { userId: null })
  try {
    const requestParams = {
      secureLogin: config.pragmatic.secureLogin,
      bonusCode,
    }
    const hash = calculateAuthHash(requestParams)
    const qs = new URLSearchParams({
      ...requestParams,
      hash,
    })
    const response = await axios({
      url: getUrl(ApiPaths.cancelFreeRoundsApi, '') + `?${qs}`,
      ...jsonRequest,
    })
    logger.info('cancelFrb response', { bonusCode, data: response.data })
    if (response.data.error != '0') {
      throw response.data.description
    }
    return response.data
  } catch (error) {
    logger.error('error canceling pragmatic frb', {}, error)
    throw error
  }
}

export async function getPlayersFrb(userId: string) {
  try {
    const requestParams = {
      secureLogin: config.pragmatic.secureLogin,
      playerId: createPragId(userId, 'usd'),
    }
    const hash = calculateAuthHash(requestParams)
    const qs = new URLSearchParams({
      ...requestParams,
      hash,
    })
    const response = await axios({
      url: getUrl(ApiPaths.getSimpleFreeRoundsApi, '') + `?${qs}`,
      ...jsonRequest,
    })
    if (response.data.error != '0') {
      // throw response.data.description
      return { bonuses: [] }
    }
    return response.data
  } catch (error) {
    pragmaticLogger('getPlayersFrb', { userId }).error(
      'error getting pragmatic frb',
      {},
      error,
    )
    return { bonuses: [] }
  }
}

export async function getBetScalesForGame(gameId: string) {
  try {
    const requestParams = {
      secureLogin: config.pragmatic.secureLogin,
      gameIDs: gameId,
      currencies: 'USD',
    }
    const hash = calculateAuthHash(requestParams)
    const qs = new URLSearchParams({
      ...requestParams,
      hash,
    })
    const response = await axios({
      url: getUrl(ApiPaths.getBetScalesApi, '') + `?${qs}`,
      ...jsonRequest,
    })
    return response?.data?.gameList[0]?.betScaleList[0]?.totalBetScales
  } catch (error) {
    pragmaticLogger('getBetScalesForGame', { userId: null }).error(
      'error getting pragmatic frb',
      {},
      error,
    )
    return { bonuses: [] }
  }
}

export async function createVariableFrb({
  userId,
  gameId,
  rounds,
  periodOfTime,
  betPerRound,
  frType,
  startDate = '',
  expirationDate = '',
  logTransaction = false,
  errorsFreeSpins,
  sendNotification = true,
  reason,
  issuerId,
}: CreateVariableFrbArgs) {
  const logger = pragmaticLogger('createVariableFrb', { userId })
  const user = await getUserById(userId)
  if (!user) {
    return
  }
  const randomNumber = Math.floor(Math.random() * (100000 - 1 + 1)) + 1
  const bonusCode =
    Math.round(Date.now() / 1000).toString() + '-' + randomNumber
  const expiry = expirationDate
    ? new Date(expirationDate)
    : addTimeInDuration(30, 'days', new Date())

  try {
    const requestParams = {
      secureLogin: config.pragmatic.secureLogin,
      playerId: createPragId(userId, 'usd'),
      bonusCode,
      frType,
      rounds,
      periodOfTime,
      currency: 'USD',
      startDate: startDate
        ? getUnixTimeFromDate(new Date(startDate))
        : getUnixTimeFromDate(new Date()),
      expirationDate: getUnixTimeFromDate(expiry),
    }
    logger.info('createVariableFrb requestParams', { requestParams })
    const hash = calculateAuthHash(requestParams)
    // @ts-expect-error TODO find a way to convert to Record of strings cleanly
    const qs = new URLSearchParams({
      ...requestParams,
      hash,
    })
    const response = await axios({
      url: getUrl(ApiPaths.FreeRoundsBonusApi, '') + `?${qs}`,
      ...jsonRequest,
      data: {
        gameList: [
          {
            gameId,
            betValues: [{ totalBet: betPerRound, currency: 'USD' }],
          },
        ],
      },
    })

    if (response.data.error != '0') {
      throw response.data.description
    }

    await Promise.all([
      createFreespins({
        gameId,
        userId,
        issuerId,
        expiry,
        reason,
        gameIds: [gameId],
        quantity: rounds,
        betLevel: betPerRound,
        totalAmount: rounds * betPerRound,
      }),
      logTransaction
        ? createTransaction({
            user,
            amount: 0,
            transactionType: 'bonus',
            meta: {
              rounds,
              periodOfTime,
              gameId,
              betPerRound,
              frType,
              provider: 'pragmatic',
            },
            balanceType: 'crypto',
            resultantBalance: user.balance,
          })
        : Promise.resolve(),
    ])
    // Keeps track of the bonus codes that may need to be rolled back
    if (errorsFreeSpins) {
      errorsFreeSpins.pragmaticBonusCodes.push(bonusCode)
    }
    if (sendNotification) {
      const gameIdentifier = `pragmatic:${gameId}`
      await createFreeSpinUserNotification({ userId, gameIdentifier })
    }

    return response.data
  } catch (error) {
    logger.error('error creating pragmatic frb', {}, error)
    throw error
  }
}

export function makeSuccessResponse<T>(
  response: T,
): T & { error: 0; description: 'success' } {
  return {
    ...response,
    error: SeamlessWalletStatusCodes.SUCCESS,
    description: 'success',
  }
}

export function makeErrorResponse(
  description: string,
  error: ErrorCode,
): PragErrorResponse {
  return { description, error } as const
}
