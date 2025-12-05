import express from 'express'

import { api, type RouterApp } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { getProvider } from '../util/getProvider'
import {
  stakeTrxBalance,
  derivePoolingWallet,
  getAccountResources,
} from 'src/modules/crypto/tron/lib'
import { logAdminAction, roleCheck } from 'src/modules/admin/middleware'
import {
  isTronFrozenAsset,
  isTronStakeMode,
} from 'src/modules/crypto/tron/types'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/tron', router)

  router.post(
    '/transaction/stake',
    api.check,
    ...roleCheck([{ resource: 'deposits', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { amount, resource, mode } = req.body
      const provider = getProvider()

      if (!amount) {
        return {
          success: false,
          error: 'stake/unstake amount is required',
        }
      }

      if (!isTronStakeMode(mode)) {
        return {
          success: false,
          error: 'stake mode is required (freeze or unfreeze)',
        }
      }

      if (!isTronFrozenAsset(resource)) {
        return {
          success: false,
          error: 'Invalid Frozen asset type, it should be BANDWIDTH or ENERGY',
        }
      }

      try {
        const { address, privateKey } = derivePoolingWallet()
        const { success } = await stakeTrxBalance(
          address,
          privateKey,
          amount,
          resource,
          mode,
        )

        if (!success) {
          return {
            success: false,
            error:
              'Can not proceed to stake/unstake Tron, try again after checking wallet status',
          }
        }

        const accountData = await provider.trx.getAccount(address)

        const frozen = accountData.frozenV2.reduce(
          (
            item: number,
            currentValue: { amount?: number; type?: 'ENERGY' | 'TRON_POWER' },
          ) => {
            if (currentValue.amount) {
              item = item + currentValue.amount
            }
            return item
          },
          0,
        )

        return {
          success: true,
          data: { frozen, unFrozen: accountData.unfrozenV2 },
          error: null,
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        }
      }
    }),
  )

  router.get(
    '/account/resource',
    api.check,
    ...roleCheck([{ resource: 'deposits', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async () => {
      const resource = await getAccountResources()
      if (resource.success) {
        return {
          ...resource.result,
        }
      }
      throw new APIValidationError(resource.error.message)
    }),
  )
}
