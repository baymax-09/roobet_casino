import { scopedLogger } from 'src/system/logger'
import { makeSlotegratorRequest } from './api'
import {
  deleteSlotegratorFreespins,
  hoistSlotegratorFreespinDocument,
  updateSlotegratorFreespinRecord,
} from '../documents/slotegratorFreespins'
import { config } from 'src/system'
import { createTransaction } from 'src/modules/user/documents/transaction'
import { getUserById } from 'src/modules/user'
import { type TPGame } from 'src/modules/tp-games'
import { createFreeSpinUserNotification } from 'src/vendors/game-providers/util'

const slotegratorFreespinLogger = scopedLogger('slotegratorSlots-freespinApi')

const slotegratorFreespinCurrency = config.slotegrator.currency

const ONE_MONTH = 2629800000

const makeFreeSpinSuccessResponse = (payload: object) => {
  return { success: true, payload } as const
}
const makeFreeSpinErrorResponse = (message: string) => {
  return { success: false, message } as const
}

export interface CreateFreespinsProps {
  issuerId: string
  reason: string
  userId: string
  campaignName: string
  game: TPGame
  rounds: number
  betLevel: string
  startDate?: number
}

interface CreateFreespinPayload {
  player_id: string
  player_name: string
  freespin_id: string
  currency: string
  game_uuid: string
  quantity: string
  denomination: string
  bet_id: string
  valid_from: number
  valid_until: number
}

interface CreateFreespinCampaignResponse {
  status: string
  [key: string]: any
}

export const createFreespinCampaign = async ({
  issuerId,
  reason,
  userId,
  campaignName,
  game,
  rounds,
  betLevel,
  startDate = Date.now(),
}: CreateFreespinsProps) => {
  const logger = slotegratorFreespinLogger('createFreespinCampaign', { userId })

  const user = await getUserById(userId)
  if (!user) {
    return makeFreeSpinErrorResponse('User not found')
  }
  const campaignIdentifierTuple = {
    userId,
    campaignName,
    gameIdentifier: game.identifier,
  }
  const docResponse = await hoistSlotegratorFreespinDocument(
    campaignIdentifierTuple,
  )
  if (docResponse.existed) {
    return makeFreeSpinErrorResponse(
      'Found existing freespin campaign for this user on this game',
    )
  }
  const freespinIdInterrupt = docResponse.documentId.toString()

  const freeSpinCampaignPayload: CreateFreespinPayload = {
    player_id: user.id,
    player_name: user.name,
    freespin_id: freespinIdInterrupt,
    currency: slotegratorFreespinCurrency,
    game_uuid: game.gid,
    quantity: rounds.toString(),
    denomination: betLevel,
    bet_id: '0',
    valid_from: Math.floor(startDate / 1000),
    valid_until: Math.floor((startDate + ONE_MONTH) / 1000),
  }
  const updatePayload = {
    campaignName,
    rounds,
    roundsRemaining: rounds,
    expiry: new Date(freeSpinCampaignPayload.valid_until * 1000),
    betLevel,
    issuerId,
    reason,
  }
  try {
    const response = await makeSlotegratorRequest<
      CreateFreespinCampaignResponse,
      CreateFreespinPayload
    >({
      path: 'freespins/set',
      method: 'POST',
      data: freeSpinCampaignPayload,
    })
    if (response.status !== 'Created') {
      logger.error(
        'Provider level error creating freespin campaign, deleting doc',
        {
          creationPayload: freeSpinCampaignPayload,
          response,
        },
      )
      await deleteSlotegratorFreespins(freespinIdInterrupt)
      return makeFreeSpinErrorResponse(
        'Provider level error creating freespin campaign',
      )
    }

    await updateSlotegratorFreespinRecord(freespinIdInterrupt, updatePayload)
    await createTransaction({
      user,
      amount: 0,
      transactionType: 'bonus',
      balanceType: 'crypto',
      resultantBalance: user.balance,
      meta: {
        freespins_quantity: rounds,
        bet_level: betLevel,
        games: [game.identifier],
        provider: 'slotegrator',
      },
    })

    await createFreeSpinUserNotification({
      userId,
      gameIdentifier: game.identifier,
    })

    return makeFreeSpinSuccessResponse(response)
  } catch (error) {
    logger.error('call failed', error.response?.data?.message || error)
    await deleteSlotegratorFreespins(freespinIdInterrupt)
    return makeFreeSpinErrorResponse(error.response?.data?.message)
  }
}

export const cancelFreespinCampaign = async (freespinId: string) => {
  const logger = slotegratorFreespinLogger('cancelFreespinCampaign', {
    userId: null,
  })
  try {
    const response = await makeSlotegratorRequest({
      path: 'freespins/cancel',
      method: 'POST',
      data: { freespin_id: freespinId },
    })
    await deleteSlotegratorFreespins(freespinId)
    return makeFreeSpinSuccessResponse(response)
  } catch (error) {
    logger.error('call failed', error.response?.data?.message || error)
    return makeFreeSpinErrorResponse(error.response?.data?.message)
  }
}

export const fetchFreespinConfig = async (gid: string) => {
  const logger = slotegratorFreespinLogger('fetchFreespinConfig', {
    userId: null,
  })
  try {
    const response = await makeSlotegratorRequest({
      path: `freespins/bets?game_uuid=${gid}&currency=${slotegratorFreespinCurrency}`,
      method: 'GET',
    })
    return makeFreeSpinSuccessResponse(response)
  } catch (error) {
    logger.error('call failed', error.response?.data?.message || error)
    return makeFreeSpinErrorResponse(error.response?.data?.message)
  }
}
