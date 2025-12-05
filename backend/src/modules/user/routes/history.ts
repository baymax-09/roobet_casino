import { Router } from 'express'

import { api, type RoobetReq, type RouterApp } from 'src/util/api'
import { getPaginatedDeposits } from 'src/modules/deposit/documents/deposit_transactions_mongo'
import { getPaginatedWithdrawals } from 'src/modules/withdraw/documents/withdrawals_mongo'
import { BetHistoryModel } from 'src/modules/bet/documents/bet_history_mongo'
import { TransactionModel } from 'src/modules/user/documents/transaction'
import { APIValidationError } from 'src/util/errors'

import { paginateHistory } from '../lib/history'

interface HistoryReqDefaults {
  orderBy: string
  order: string
  limit: number
  page: number
}
interface HistoryRequest extends HistoryReqDefaults {
  userId: string
}

const parseHistoryRequest = (
  req: RoobetReq,
  defaults: HistoryReqDefaults,
): HistoryRequest => ({
  userId: req.user.id,
  limit:
    typeof req.query?.limit === 'string'
      ? parseInt(req.query.limit)
      : defaults.limit,
  page:
    typeof req.query?.page === 'string'
      ? parseInt(req.query.page)
      : defaults.page,
  order:
    typeof req.query?.order === 'string' ? req.query.order : defaults.order,
  orderBy:
    typeof req.query?.orderBy === 'string'
      ? req.query.orderBy
      : defaults.orderBy,
})

export default function (app: RouterApp) {
  const router = Router()
  app.use('/history', router)

  // @TODO separate function for pagination between crypto and cash deposit collections
  router.get(
    '/deposits',
    api.check,
    api.validatedApiCall(async req => {
      const { userId, limit, page, order, orderBy } = parseHistoryRequest(
        req as RoobetReq,
        {
          limit: 10,
          page: 0,
          order: 'desc',
          orderBy: 'createdAt',
        },
      )

      const sortOrder = order === 'desc' ? -1 : 1

      return await getPaginatedDeposits({
        userId,
        limit,
        page,
        sort: { [orderBy]: sortOrder },
      })
    }),
  )

  router.get(
    '/withdrawals',
    api.check,
    api.validatedApiCall(async req => {
      const { userId, limit, page, order, orderBy } = parseHistoryRequest(
        req as RoobetReq,
        {
          limit: 10,
          page: 0,
          order: 'desc',
          orderBy: 'createdAt',
        },
      )

      const sortOrder = order === 'desc' ? -1 : 1

      return await getPaginatedWithdrawals({
        userId,
        limit,
        page,
        sortKey: orderBy,
        sort: sortOrder,
      })
    }),
  )

  router.get(
    '/bets',
    api.check,
    api.validatedApiCall(async req => {
      const { userId, limit, page, order, orderBy } = parseHistoryRequest(
        req as RoobetReq,
        {
          limit: 10,
          page: 0,
          order: 'desc',
          orderBy: 'timestamp',
        },
      )
      const sortOrder = order === 'desc' ? -1 : 1
      return await paginateHistory(
        userId,
        limit,
        page,
        BetHistoryModel,
        orderBy,
        sortOrder,
      )
    }),
  )

  router.get(
    '',
    api.check,
    api.validatedApiCall(async req => {
      const type = req.query?.type

      if (typeof type !== 'string') {
        throw new APIValidationError('Invalid transaction type supplied.')
      }

      const { userId, limit, page, order, orderBy } = parseHistoryRequest(
        req as RoobetReq,
        {
          limit: 10,
          page: 0,
          order: 'desc',
          orderBy: 'timestamp',
        },
      )
      const sortOrder = order === 'desc' ? -1 : 1
      return await paginateHistory(
        userId,
        limit,
        page,
        TransactionModel,
        orderBy,
        sortOrder,
        type,
      )
    }),
  )
}
