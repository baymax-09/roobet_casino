import { v4 as uuidv4 } from 'uuid'

import { config } from 'src/system'
import { createTransaction } from 'src/modules/user/documents/transaction'
import { getUserById } from 'src/modules/user'
import { type ErrorFreeSpins } from 'src/modules/inventory/documents/types'
import { type FreespinIssuer } from 'src/modules/tp-games'
import { createFreeSpinUserNotification } from '../../util'

import { type HacksawStatusResponse, makeHacksawRequest } from './api'
import { createFreespin } from '../documents/freespins'

interface PendingFreespinsResponse extends HacksawStatusResponse {
  freeRounds: FreeRounds[]
}

interface FreeRounds {
  gameId: number
  nbRounds: number
  betLevel: number
  externalOfferId: string
  channel: number
  createDate: string
  expiryDate: string
}

interface AwardFreeRoundsRequest {
  username: string
  password: string
  externalId: string
  gameId: number
  nbRounds: number
  betLevel: number
  externalOfferId: string
  expiryDate?: string
}

export const getActiveBonusesForUser = async (
  userId: string,
): Promise<FreeRounds[]> => {
  const response = await makeHacksawRequest<PendingFreespinsResponse>({
    path: `v1/partner/${config.hacksaw.partnerId}/getPendingFreeRoundsForPlayer`,
    method: 'POST',
    data: {
      username: config.hacksaw.apiUsername,
      password: config.hacksaw.apiPassword,
      externalId: userId,
    },
  })

  return response ? response?.freeRounds : []
}

export const issueBonus = async ({
  userId,
  amount,
  rounds,
  gameId,
  expiresAt,
  errorsFreeSpins,
  sendNotification = true,
  issuerId,
  reason,
}: {
  userId: string
  amount: number
  rounds: number
  gameId: string
  expiresAt?: Date
  errorsFreeSpins?: ErrorFreeSpins
  sendNotification?: boolean
  issuerId: FreespinIssuer
  reason: string
}) => {
  const user = await getUserById(userId)
  if (!user) {
    throw Error('Invalid user.')
  }

  const betLevel = amount * 100
  const externalOfferId = uuidv4()
  const dataPayload: AwardFreeRoundsRequest = {
    username: config.hacksaw.apiUsername,
    password: config.hacksaw.apiPassword,
    externalId: userId,
    gameId: parseInt(gameId),
    nbRounds: rounds,
    betLevel, // cents, euros
    externalOfferId,
  }

  // Keeps track of the issueIds that may need to be rolled back
  if (errorsFreeSpins) {
    errorsFreeSpins.hacksawExternalOfferIds.push(externalOfferId)
  }

  if (expiresAt) {
    dataPayload.expiryDate = expiresAt.toUTCString()
  }

  const response = await makeHacksawRequest<HacksawStatusResponse>({
    path: `v1/partner/${config.hacksaw.partnerId}/awardFreeRounds`,
    method: 'POST',
    data: dataPayload,
  })

  if (!response) {
    throw Error('Failed to create free spins.')
  }

  await Promise.all([
    createFreespin({
      gameId,
      userId,
      issuerId,
      expiry: expiresAt,
      reason,
      gameIds: [gameId],
      quantity: rounds,
      betLevel: amount,
      totalAmount: rounds * amount,
    }),
    createTransaction({
      user,
      amount: 0,
      transactionType: 'bonus',
      meta: { rounds, expiresAt, gameId, provider: 'hacksaw' },
      balanceType: 'crypto',
      resultantBalance: user.balance,
    }),
  ])

  if (sendNotification) {
    const gameIdentifier = `hacksaw:${gameId}`
    await createFreeSpinUserNotification({ userId, gameIdentifier })
  }
}

export const revokeBonus = async ({
  userId,
  externalOfferId,
}: {
  userId: string
  externalOfferId: string
}) => {
  const dataPayload = {
    username: config.hacksaw.apiUsername,
    password: config.hacksaw.apiPassword,
    externalId: userId,
    externalOfferId,
  }

  await makeHacksawRequest<HacksawStatusResponse>({
    path: `v1/partner/${config.hacksaw.partnerId}/removeFreeRounds`,
    method: 'POST',
    data: dataPayload,
  })

  return true
}
