import { Router } from 'express'
import json2csv from 'json2csv'
import { isValidObjectId } from 'mongoose'

import { isValidCryptoDepositType } from 'src/modules/deposit/types'
import { getAllInfluencers } from 'src/modules/crm/lib'
import { tableSearchTransactions } from 'src/modules/user/documents/transaction'
import { api } from 'src/util/api'
import { tableSearchBets } from 'src/modules/bet/documents/bet_history_mongo'
import {
  getPaginatedDeposits,
  tableSearchDeposits,
} from 'src/modules/deposit/documents/deposit_transactions_mongo'
import {
  getPaginatedWithdrawals,
  tableSearchWithdrawals,
} from 'src/modules/withdraw/documents/withdrawals_mongo'
import { tableSearchTPGameCategories } from 'src/modules/tp-games/documents/games'
import { tableSearchUsers } from 'src/modules/user/documents/user'
import { getCashDepositTransactionsForAdmin } from 'src/vendors/paymentiq/documents/cash_deposit_transactions'
import { getCashWithdrawalTransactionsForAdmin } from 'src/vendors/paymentiq/documents/cash_withdrawal_transactions'

import { isWithdrawalPluginType } from 'src/modules/withdraw/types'

import { roleCheck } from '../middleware'

const parseSearchFilters = (filterObj: Record<string, any>) => {
  const { _id, ...filters } = filterObj

  // Support Regex search.
  for (const [key, value] of Object.entries(filters)) {
    if (
      typeof value === 'string' &&
      value.charAt(0) === '/' &&
      value.charAt(value.length - 1) === '/'
    ) {
      filters[key] = new RegExp(value.slice(1, -1), 'i')
    }
  }

  if (_id && !isValidObjectId(_id)) {
    return filters
  }

  return { ...filterObj, ...filters }
}

export function createTableRouter() {
  const router = Router()

  router.post(
    '/users',
    ...roleCheck([{ resource: 'sponsors', action: 'read' }]),
    api.validatedApiCall(async req => {
      const { limit, page, sortObj, filterObj } = req.body
      const sort = sortObj ?? { createdAt: -1 }
      const filter = parseSearchFilters(filterObj)

      return await tableSearchUsers(limit, page, sort, filter)
    }),
  )

  router.post(
    '/influencers',
    ...roleCheck([{ resource: 'sponsors', action: 'read' }]),
    api.validatedApiCall(async req => {
      const { limit, page } = req.body
      return await getAllInfluencers(limit, page)
    }),
  )

  router.get(
    '/sponsors/export',
    ...roleCheck([{ resource: 'sponsors', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const limit = 1000000
      const page = 0
      const filter = { isSponsor: true }
      const sort = { createdAt: -1 }

      const { data: sponsors } = await tableSearchUsers(
        limit,
        page,
        sort,
        filter,
      )

      const possibleFields = [
        'id',
        'username',
        'balance',
        'ethBalance',
        'ltcBalance',
        'cashBalance',
        'howieDeal',
      ]

      const data: Array<{ [K in (typeof possibleFields)[number]]: string }> =
        sponsors.map(
          ({
            id,
            name,
            balance,
            ethBalance,
            ltcBalance,
            cashBalance,
            howieDeal,
          }) => {
            // TODO portfolio balances should also return with this function
            return {
              id,
              username: name,
              balance: (balance ?? 0).toFixed(2),
              ethBalance: (ethBalance ?? 0).toFixed(2),
              ltcBalance: (ltcBalance ?? 0).toFixed(2),
              cashBalance: (cashBalance ?? 0).toFixed(2),
              howieDeal: howieDeal ? JSON.stringify(howieDeal) : '',
            }
          },
        )

      const sheet = json2csv({
        data,
        fields: possibleFields,
        fieldNames: possibleFields,
      })

      res.attachment('All Sponsors.csv')
      res.status(200).send(sheet)
    }),
  )

  router.post(
    '/bets',
    ...roleCheck([{ resource: 'bets', action: 'read' }]),
    api.validatedApiCall(async req => {
      const { limit, page, sortObj, filterObj } = req.body
      if (filterObj && filterObj.gameName === 'sportsbook') {
        filterObj.gameName = 'slotegrator'
      }
      const sort = sortObj ?? { timestamp: -1 }
      const filter = parseSearchFilters(filterObj)

      return await tableSearchBets(limit, page, sort, filter)
    }),
  )

  router.post(
    '/transactions',
    ...roleCheck([
      { resource: 'deposits', action: 'read' },
      { resource: 'withdrawals', action: 'read' },
    ]),
    api.validatedApiCall(async req => {
      const { limit, page, filterObj, sortObj } = req.body
      const filter = parseSearchFilters(filterObj)
      const sort = sortObj ?? { timestamp: -1 }

      return await tableSearchTransactions(limit, page, sort, filter)
    }),
  )

  router.post(
    '/deposits',
    ...roleCheck([{ resource: 'deposits', action: 'read' }]),
    api.validatedApiCall(async req => {
      const { userId, limit, page, filterObj, sortObj } = req.body
      const filter = parseSearchFilters(filterObj)
      const isCryptoDepositType = isValidCryptoDepositType(filter.depositType)
      const isCashProvider =
        !!filter.depositType && !isValidCryptoDepositType(filter.depositType)
      const defaultSortDirection = -1
      const startDate = filter?.createdAt?.$gte || undefined
      const endDate = filter?.createdAt?.$lte || undefined

      if (isCryptoDepositType) {
        return await tableSearchDeposits(
          limit,
          page,
          sortObj ?? { timestamp: defaultSortDirection },
          filter,
        )
      } else if (isCashProvider) {
        const { depositType, ...cashDepositFilter } = filter
        return await getCashDepositTransactionsForAdmin({
          userId,
          limit,
          page,
          provider: depositType,
          startDate,
          endDate,
          sort: sortObj,
          filter: cashDepositFilter,
        })
      } else {
        return await getPaginatedDeposits({
          userId,
          limit,
          page,
          startDate,
          endDate,
          sort: sortObj,
          filter,
        })
      }
    }),
  )

  router.post(
    '/withdrawals',
    ...roleCheck([{ resource: 'withdrawals', action: 'read' }]),
    api.validatedApiCall(async req => {
      const { userId, limit, page, filterObj } = req.body
      const filter = parseSearchFilters(filterObj)
      const isCryptoWithdrawType =
        filter.plugin && isWithdrawalPluginType(filter.plugin)
      const isCashProvider =
        filter.plugin && !isWithdrawalPluginType(filter.plugin)
      const sort = -1
      const startDate = filter?.createdAt?.$gte || undefined
      const endDate = filter?.createdAt?.$lte || undefined

      if (isCryptoWithdrawType) {
        return await tableSearchWithdrawals(
          limit,
          page,
          { timestamp: sort },
          filter,
          userId,
        )
      } else if (isCashProvider) {
        const { plugin, ...cashWithdrawalsFilter } = filter
        return await getCashWithdrawalTransactionsForAdmin({
          userId,
          limit,
          page,
          provider: plugin,
          startDate,
          endDate,
          filter: cashWithdrawalsFilter,
        })
      } else {
        return await getPaginatedWithdrawals({
          userId,
          limit,
          page,
          startDate,
          endDate,
          filter,
        })
      }
    }),
  )

  router.post(
    '/tp-games/category',
    ...roleCheck([{ resource: 'tpgames', action: 'read' }]),
    api.validatedApiCall(async req => {
      const { limit, page, filterObj } = req.body
      const filter = parseSearchFilters(filterObj)

      return await tableSearchTPGameCategories(limit, page, filter)
    }),
  )

  return router
}
