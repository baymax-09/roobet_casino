import express from 'express'
import moment from 'moment'

import { type Router } from 'src/util/api'
import { config, winston } from 'src/system'
import { isDepositTooOld } from 'src/modules/deposit'
import { isBlockioCryptoSymbol } from 'src/modules/crypto/types'
import { api } from 'src/util/api'

import { processTransactionForCrypto, processNewBlock } from '../lib'
import { isBlockioNotificationType } from '../types'
import { blockioLogger } from '../lib/logger'

const asyncCallback = api.scopedAsyncCallback(blockioLogger)

export default function (app: Router) {
  const router = express.Router()
  app.use('/webhook', router)

  const secretRoute = asyncCallback(async (req, res, _, logger) => {
    res.status(200).send('ok')

    const { type, data, created_at } = req.body

    if (!isBlockioNotificationType(type)) {
      logger.error('invalid notification type supplied', { type })
      return
    }

    try {
      const { crypto, secret } = req.params
      if (!isBlockioCryptoSymbol(crypto)) {
        logger.error('invalid crypto symbol supplied', { crypto })
        return
      }

      if (secret !== config.blockio.apiSecret) {
        throw new Error(`Wrong blockio api secret: ${secret}`)
      }

      // TODO there is a monitor based on this log, use logger or don't
      winston.info('crypto transaction', req.body, req.params)
      if (type === 'address' && data.amount_received > 0) {
        // @ts-expect-error dates!
        if (isDepositTooOld(moment.unix(created_at))) {
          logger.error('deposit is too old to process', req.body)
          return
        }
        await processTransactionForCrypto(crypto, data)
      }
      if (type === 'new-blocks') {
        await processNewBlock(data)
      }
    } catch (error) {
      logger.error(
        'Error processing blockio transaction',
        req?.body?.data ?? {},
        error,
      )
    }
  })

  router.post('/:crypto/s/:secret', secretRoute)
}
