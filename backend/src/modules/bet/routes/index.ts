import { Router } from 'express'
import routeCache from 'route-cache'

import { api, type RoobetReq, type RouterApp } from 'src/util/api'
import { BasicCache } from 'src/util/redisModels'
import { userRouteCache } from 'src/util/helpers/routeCache'
import { getHVAndVIP } from 'src/modules/user'
import { getSystemSetting } from 'src/modules/userSettings'
import { APIValidationError } from 'src/util/errors'

import {
  getRecentBetHistory,
  getRecentBetHistoryForUser,
  getHighRollers,
  getLuckyWins,
  ensureIncognitoState,
  getBiggestRecentBets,
  getLuckiestRecentBets,
} from '../documents/bet_history_mongo'
import { type BetLeaderboardType } from '../documents/bet_leaderboard'

import {
  convertLegacyGameIdentifierToLegacyGameName,
  distributeHouseAndTPGames,
} from '../util'
import { populateGameDataOnBets } from '../lib/games'

const BASIC_CACHE_NAME = 'bet'

export default function (app: RouterApp) {
  const router = Router()
  app.use('/bet', router)

  router.get(
    '/getRecentBetHistory',
    routeCache.cacheSeconds(5, 'getRecentBetHistory'),
    api.validatedApiCall(async req => {
      const { page, limit } = req.query

      const [recentBets, highRollers, luckyWins] = await Promise.all([
        getRecentBetHistory(
          parseInt(limit as string) || 25,
          parseInt(page as string) || 0,
        )
          .then(ensureIncognitoState)
          .then(distributeHouseAndTPGames),

        getHighRollers()
          .then(ensureIncognitoState)
          .then(distributeHouseAndTPGames),

        getLuckyWins()
          .then(ensureIncognitoState)
          .then(distributeHouseAndTPGames),
      ])

      const betsWithGameData = await populateGameDataOnBets([
        ...recentBets,
        ...highRollers,
        ...luckyWins,
      ])

      return {
        recentBets: betsWithGameData.filter(({ _id }) =>
          recentBets.find(bet => bet._id === _id),
        ),
        highRollers: betsWithGameData.filter(({ _id }) =>
          highRollers.find(bet => bet._id === _id),
        ),
        luckyWins: betsWithGameData.filter(({ _id }) =>
          luckyWins.find(bet => bet._id === _id),
        ),
      }
    }),
  )

  router.get(
    '/getUserHistory',
    api.check,
    userRouteCache(),
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { limit, page } = req.query
      const betHistory = await getRecentBetHistoryForUser(
        user.id,
        parseInt(limit as string) || 25,
        parseInt(page as string) || 0,
      )
      return await populateGameDataOnBets([...betHistory])
    }),
  )

  const hideVipsAndIncognito =
    (vipIds: string[]) => async (bet: BetLeaderboardType) => {
      const userIsIncognito = await getSystemSetting(
        bet.userId,
        'feed',
        'incognito',
      )
      if (vipIds.includes(bet.userId) || userIsIncognito) {
        return { ...bet, hidden: true, user: null, incognito: true }
      }
      return bet
    }

  router.get(
    '/leaderboards/:gameIdentifier',
    api.validatedApiCall(async req => {
      let { gameIdentifier } = req.params
      const getVipIds = async () =>
        await getHVAndVIP().then(user =>
          user.filter(({ role }) => role === 'VIP').map(({ id }) => id),
        )

      const vipIds = await BasicCache.cached(
        BASIC_CACHE_NAME,
        'vipUserIds',
        60,
        getVipIds,
      )

      if (typeof gameIdentifier !== 'string') {
        throw new APIValidationError('api__missing_param', ['gameIdentifier'])
      }

      // Need to remove housegames: portion from old house games (eg towers, dice, roulette)
      gameIdentifier =
        convertLegacyGameIdentifierToLegacyGameName(gameIdentifier)

      const getBets = async () =>
        await Promise.all([
          getBiggestRecentBets(gameIdentifier).then(async leaderboard => ({
            alltime: await Promise.all(
              leaderboard.alltime.map(hideVipsAndIncognito(vipIds)),
            ),
            week: await Promise.all(
              leaderboard.week.map(hideVipsAndIncognito(vipIds)),
            ),
          })),
          getLuckiestRecentBets(gameIdentifier).then(async leaderboard => ({
            alltime: await Promise.all(
              leaderboard.alltime.map(hideVipsAndIncognito(vipIds)),
            ),
            week: await Promise.all(
              leaderboard.week.map(hideVipsAndIncognito(vipIds)),
            ),
          })),
        ])

      const [biggest, luckiest] = await BasicCache.cached(
        BASIC_CACHE_NAME,
        `leaderboards:${gameIdentifier}`,
        60,
        getBets,
      )
      return { biggest, luckiest }
    }),
  )
}
