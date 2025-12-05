import { Router } from 'express'

import { api } from 'src/util/api'

import { roleCheck } from '../middleware'
import { getAllRaffles } from '../../raffle/documents/raffle'

export function createRafflesRouter() {
  const router = Router()

  router.get(
    '/',
    ...roleCheck([{ resource: 'raffles', action: 'read' }]),
    api.validatedApiCall(async () => {
      const raffles = await getAllRaffles()

      return {
        raffles,
      }
    }),
  )

  return router
}
