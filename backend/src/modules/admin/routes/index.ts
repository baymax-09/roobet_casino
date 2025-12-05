import { type Router } from 'express'
import express from 'express'
import shortid from 'shortid'
import multer from 'multer'

import mimeTypes from 'mime-types'
import { media } from 'src/util/media'
import { isTogglableSystemName } from 'src/modules/userSettings'
import { isRoleAccessPermitted } from 'src/modules/rbac'
import {
  setDynamicSettings,
  getDynamicSettings,
  changeSystemEnabledGlobal,
  isLegacyMappedSystemName,
} from 'src/modules/siteSettings'
import {
  api,
  type RouterApp,
  type RouterPassport,
  type RouterIO,
  type RoobetReq,
} from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import {
  getBlockByBlockHash,
  depositRedisKeys,
  depositProcessName,
} from 'src/modules/crypto/lib'
import {
  getLatestProcessedBlock,
  getLatestProcessedInternalBlock,
} from 'src/modules/crypto/ethereum/documents/ethereum_blocks'
import { getLatestProcessedBlock as getLatestProcessedTronBlock } from 'src/modules/crypto/tron/documents/tron_blocks'
import { getLastLedger } from 'src/modules/crypto/ripple/documents/ripple_ledgers'
import { getUsersWhoTouchedIp } from 'src/modules/fraud/geofencing/documents/ip_tracer'
import { BasicCache } from 'src/util/redisModels'
import { runReport } from 'src/modules/stats/reporting/lib'
import { updateAdminLookups } from 'src/modules/user'
import { isBlockioCryptoProperName } from 'src/modules/crypto/types'

import { logAdminAction, roleCheck } from '../middleware'
import { createRoowardsRouter } from './roowards'
import { createStatsRouter } from './stats'
import { createUsersRouter } from './users'
import { createNotesRouter } from './notes'
import { createTableRouter } from './table'
import { createRafflesRouter } from './raffles'
import { createReportingRouter } from './reporting'
import { createUserRouter } from './user'
import { createKycRouter } from './kyc'
import { createRolesRouter } from './roles'
import { createTPGamesRouter } from './tp-games'
import { createCMSRouter } from './cms'

const upload = multer()

const routers: Array<[string, Router, boolean?]> = [
  ['/roowards', createRoowardsRouter()],
  ['/notes', createNotesRouter()],
  ['/stats', createStatsRouter()],
  ['/users', createUsersRouter()],
  ['/table', createTableRouter()],
  ['/raffle', createRafflesRouter()],
  ['/reporting', createReportingRouter(), false],
  ['/user', createUserRouter()],
  ['/kyc', createKycRouter()],
  ['/roles', createRolesRouter()],
  ['/tp-games', createTPGamesRouter()],
  ['/cms', createCMSRouter()],
]

export default function (app: RouterApp, _: RouterPassport, io: RouterIO) {
  const router = express.Router()
  app.use('/admin', router)

  for (const [path, routerToMount, apiCheck = true] of routers) {
    if (apiCheck) {
      router.use(path, api.check, routerToMount)
    } else {
      router.use(path, routerToMount)
    }
  }

  router.get(
    '/getHiddenSettings',
    api.check,
    ...roleCheck([{ resource: 'account', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const settings = await getDynamicSettings(true)
      res.json(settings)
    }),
  )

  router.get(
    '/forceRefresh',
    api.check,
    ...roleCheck([{ resource: 'refresh', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async () => {
      io.sockets.emit('forceRefresh')
    }),
  )

  router.get(
    '/refreshRequired',
    api.check,
    ...roleCheck([{ resource: 'refresh', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async () => {
      io.sockets.emit('refreshRequired')
    }),
  )

  router.post(
    '/saveLookups',
    api.check,
    api.validatedApiCall(async (req, res) => {
      const { adminLookups } = req.body
      const { user } = req as RoobetReq

      const result = await updateAdminLookups(user.id, adminLookups)
      res.json(result)
    }),
  )

  router.post(
    '/changeSystemEnabled',
    api.check,
    ...roleCheck([{ resource: 'toggles', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { systemName, enabled } = req.body
      if (
        !isTogglableSystemName(systemName) ||
        !isLegacyMappedSystemName(systemName)
      ) {
        throw new APIValidationError('api__invalid_param', ['systemName'])
      }
      await changeSystemEnabledGlobal(systemName, enabled)
    }),
  )

  router.post(
    '/settings/updateBanner',
    api.check,
    ...roleCheck([{ resource: 'banner', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { banner, bannerLink, bannerLinkTitle } = req.body

      await setDynamicSettings({
        banner,
        bannerLink,
        bannerLinkTitle,
      })
    }),
  )

  router.get(
    '/getTouchedIps',
    api.check,
    ...roleCheck([{ resource: 'iplookup', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const { ip } = req.query
      if (!ip || typeof ip !== 'string') {
        res.status(500).send('Supply an IP address')
        return
      }

      const data = await getUsersWhoTouchedIp(ip)
      res.json(data)
    }),
  )

  router.get(
    '/userStats',
    api.check,
    ...roleCheck([{ resource: 'reports', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const { orderBy, startDate, endDate, limit } = req.query

      if (!orderBy || !startDate || !endDate) {
        throw new APIValidationError('api__missing_param', [
          'orderBy/startDate/endDate',
        ])
      }

      if (
        typeof orderBy !== 'string' ||
        typeof startDate !== 'string' ||
        typeof endDate !== 'string'
      ) {
        throw new APIValidationError('api__invalid_param', [
          'orderBy/startDate/endDate',
        ])
      }

      if (limit && typeof limit !== 'string') {
        throw new APIValidationError('api__invalid_param', ['limit'])
      }

      const { result } = await runReport('userStats', {
        orderBy,
        startDate,
        endDate,
        limit: limit ? parseInt(limit) : undefined,
      })

      res.json(result)
    }),
  )

  router.get(
    '/statsByRange',
    api.check,
    ...roleCheck([{ resource: 'reports', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const { startDate, endDate } = req.query

      if (typeof startDate !== 'string' || typeof endDate !== 'string') {
        throw new APIValidationError('api__missing_param', [
          'startDate/endDate',
        ])
      }

      const { result } = await runReport('statsByRange', {
        startDate,
        endDate,
      })

      res.json(result)
    }),
  )

  router.get(
    '/stats',
    api.check,
    ...roleCheck([{ resource: 'reports', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const { user } = req as RoobetReq
      const hasGlobalStatsReadAccess = await isRoleAccessPermitted({
        user,
        requests: [{ action: 'read', resource: 'global_stats' }],
      })
      const { result } = await runReport('stats', {
        hasGlobalStatsReadAccess,
      })

      res.json(result)
    }),
  )

  router.post(
    '/media',
    api.check,
    ...roleCheck([{ resource: 'content', action: 'create' }]),
    upload.single('file'),
    api.validatedApiCall(async req => {
      if (!req.file) {
        throw new APIValidationError(
          'Request must include the binary as a `file` form data property.',
        )
      }

      if (!req.body.filename) {
        throw new APIValidationError(
          'The filename must be included in the request body.',
        )
      }

      const dest = 'publicImages'
      const contents = req.file.buffer

      const ext = mimeTypes.extension(req.file.mimetype)
      const path = `${req.body.filename}-${shortid.generate()}.${ext}`

      try {
        await media.upload({
          dest,
          path,
          contents,
        })
      } catch (error) {
        // Return error message if available.
        if (error instanceof Error) {
          throw new APIValidationError(error.message)
        }

        throw error
      }

      return {
        success: true,
        // Note: This url will only work if the bucket has public read access.
        publicUrl: media.getPublicUrl({ dest, path }),
      }
    }),
  )

  router.get(
    '/getCurrentBlock',
    api.check,
    ...roleCheck([{ resource: 'deposits', action: 'read' }]),
    api.validatedApiCall(async req => {
      const { crypto } = req.query

      if (!crypto) {
        throw new APIValidationError('No crypto provided')
      }

      if (crypto === 'Ethereum') {
        const latestSmart = await getLatestProcessedInternalBlock()
        const latestRegular = await getLatestProcessedBlock()
        return {
          smartContract: latestSmart?.height,
          regular: latestRegular?.height,
          erc20: latestRegular?.height,
        }
      }

      if (isBlockioCryptoProperName(crypto)) {
        const blockhash = await BasicCache.get(
          depositProcessName,
          depositRedisKeys[crypto],
        )
        try {
          const block = await getBlockByBlockHash(crypto, blockhash)
          return {
            height: block.height,
          }
        } catch (error) {
          throw new APIValidationError('Failed to lookup block')
        }
      }

      if (crypto === 'Ripple') {
        const latestLedger = await getLastLedger()
        return latestLedger?.ledgerIndex
      }

      if (crypto === 'Tron') {
        const blockDoc = await getLatestProcessedTronBlock()
        return blockDoc?.height
      }

      return { success: true }
    }),
  )
}
