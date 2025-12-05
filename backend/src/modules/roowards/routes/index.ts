import express from 'express'
import moment from 'moment'

import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'
import { MutexLock } from 'src/util/named-lock'

import { countReloadsForUser } from '../documents/RoowardsReload'
import { claimRoowards, rewardMap, isValidRoowardsTimespan } from '../lib'
import { getRoowardsForUserId } from '../documents/Roowards'
import { getLevels, levelInfo } from 'src/modules/roowards'
import { createReloadRoute } from './reload'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/roowards', router)

  router.use('/reload', createReloadRoute())

  router.get(
    '/claim',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      if (user.roowardsDisabled || user.isPromoBanned) {
        throw new APIValidationError('roowards__disabled')
      }

      const { type } = req.query

      if (!isValidRoowardsTimespan(type)) {
        throw new APIValidationError('roowards__invalid_type')
      }

      // Acquire lock after validating inputs.
      const lock = await MutexLock.acquireLock(
        user.id,
        'roowards',
        'claim',
        120_000,
      )

      if (!lock) {
        throw new APIValidationError('slow_down')
      }

      try {
        const amount = await claimRoowards(user, type)

        return { claimed: amount }
      } finally {
        // Only release lock once the claim is complete.
        lock.release()
      }
    }),
  )

  router.get(
    '/get',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      if (user.roowardsDisabled || user.isPromoBanned) {
        throw new APIValidationError('roowards__disabled')
      }
      const userRoowards = await getRoowardsForUserId(user.id)
      const levels = await getLevels(user, true)

      levels.d.lastClaimed = userRoowards.dLastClaimed
      levels.w.lastClaimed = userRoowards.wLastClaimed
      levels.m.lastClaimed = userRoowards.mLastClaimed

      const now = moment()
      levels.d.secondsRemaining =
        moment(userRoowards.dLastClaimed)
          .add(rewardMap.d.daysAgo, 'days')
          .diff(now, 'seconds') + 10
      levels.w.secondsRemaining =
        moment(userRoowards.wLastClaimed)
          .add(rewardMap.w.daysAgo, 'days')
          .diff(now, 'seconds') + 10
      levels.m.secondsRemaining =
        moment(userRoowards.mLastClaimed)
          .add(rewardMap.m.daysAgo, 'days')
          .diff(now, 'seconds') + 10

      const reloadCount = await countReloadsForUser(user.id)

      return {
        levels,
        levelInfo,
        hasReload: reloadCount > 0,
      }
    }),
  )
}
