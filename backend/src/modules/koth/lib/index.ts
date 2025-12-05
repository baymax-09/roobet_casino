import moment from 'moment'

import { io } from 'src/system'
import { type Types as BetTypes } from 'src/modules/bet'
import {
  getUserForDisplay,
  getUserById,
  getUserForDisplayById,
  type Types as UserTypes,
} from 'src/modules/user'
import { BasicCache } from 'src/util/redisModels'
import { getSystemSetting } from 'src/modules/userSettings'
import { createNotification } from 'src/modules/messaging'
import { translateForUserId } from 'src/util/i18n'
import { isAfter, isBefore } from 'src/util/helpers/time'
import { exists } from 'src/util/helpers/types'

import {
  getActive,
  getLooming,
  getMostRecentKOTH,
  updateKothById,
} from '../documents/koths'
import {
  addEarnings,
  getTopKingsForKothId,
  getKingForKothId,
  updateKingForKothId,
  type KothEarnings,
} from '../documents/koth_earnings'
import { creditBalance } from 'src/modules/user/balance'

import { type Transaction } from 'src/modules/user/documents/transaction'
import { getGameSquareImages } from 'src/modules/tp-games/documents/games'
import { convertTPHouseGameNameToGameIdentifier } from 'src/modules/bet/util'

import { scopedLogger } from 'src/system/logger'
const kothLogger = scopedLogger('koth')

/** Displaying banner 2 hour before/after KOTH event */
export function shouldDisplayKothInTimeRange(
  startTime: Date,
  endTime: Date,
): boolean {
  const now = moment()
  const range = 2
  const start = moment(startTime).subtract(range, 'hours')
  const end = moment(endTime).add(range, 'hours')
  return isBefore(now, end) && isAfter(now, start)
}

export function isActive(startTime: Date, endTime: Date): boolean {
  const now = moment()
  return now < moment(endTime) && now > moment(startTime)
}

/** Only used for slots bets. Used for King Roo. */
export async function rewardKoth(
  userId: string,
  bet: BetTypes.BetHistory,
): Promise<void> {
  const logger = kothLogger('rewardKoth', { userId })
  if (bet.category !== 'slots') {
    return
  }

  const ratio = 100
  const betWinRatio = (bet.payoutValue ?? 0) / bet.betAmount
  const activeKOTH = await BasicCache.cached('activeKoth', '', 5, getActive)
  const minimumKothBet = activeKOTH?.minBet ?? 1

  if (!activeKOTH || activeKOTH.whichRoo !== 'king') {
    return
  }

  const earnings = bet.betAmount * 0.0275 * 0.15
  const newKing = betWinRatio >= ratio && bet.betAmount >= minimumKothBet

  if (newKing) {
    // new king of the god damn hill.
    updateKothById(activeKOTH._id, { currentUserId: userId })
    logger.info(`New king of the hill userId=${userId}`, { activeKOTH })

    const hidden = await getSystemSetting(userId, 'feed', 'incognito')
    const user = hidden
      ? { hidden: true, userId }
      : await getUserForDisplayById(userId)

    const gameIdentifier = bet.gameIdentifier

    const gameImage = gameIdentifier
      ? (await getGameSquareImages([gameIdentifier]))[gameIdentifier]
      : null

    io.emit('kothNewKing', {
      ...user,
      gameName: bet.gameNameDisplay ? bet.gameNameDisplay : bet.gameName,
      gameMult: betWinRatio,
      gameImage,
      gameIdentifier,
    })

    if (activeKOTH.currentUserId !== userId) {
      // Previous king, let him know he's off
      const lossMessage = await translateForUserId(
        activeKOTH.currentUserId,
        'koth_loss',
      )
      await createNotification(activeKOTH.currentUserId, lossMessage, 'koth')
      // New king, let him know he's on
      const winMessage = await translateForUserId(userId, 'koth_win')
      await createNotification(userId, winMessage, 'koth')
    }

    await updateKingForKothId(activeKOTH._id, userId, {
      gameName: bet.gameNameDisplay ? bet.gameNameDisplay : bet.gameName,
      gameMult: betWinRatio,
      gameImage,
      gameIdentifier,
    })
  }
  if (activeKOTH.currentUserId || newKing) {
    // reward whoever the current KOTH is
    const kothConfig = await updateKothById(activeKOTH._id, {
      $inc: { earnings },
    })
    const user = await getUserById(newKing ? userId : activeKOTH.currentUserId)
    if (!user) {
      logger.error(`No user found with id: ${userId}`, { activeKOTH })
      return
    }
    const currentLeaderEarnings = await addEarnings(
      activeKOTH._id,
      newKing ? userId : activeKOTH.currentUserId,
      earnings,
    )

    await creditBalance({
      user,
      amount: earnings,
      meta: {
        // TODO repair KOTH interface
        kothId: activeKOTH._id.toString(),
      },
      transactionType: 'koth',
      balanceTypeOverride: 'crypto',
    })
    const emit = await BasicCache.get('koth', 'emit')
    if (!emit) {
      io.emit('kothUpdate', {
        config: kothConfig,
        currentLeaderEarnings,
      })
      BasicCache.set('koth', 'emit', true, 1)
    }
  }
}

/** Used for Astro Roo. */
export async function rewardKothCrash(
  userId: string,
  bet: BetTypes.BetHistory,
): Promise<void> {
  const logger = kothLogger('rewardKothCrash', { userId })
  if (bet.gameName !== 'crash') {
    return
  }

  const activeKOTH = await BasicCache.cached('activeKoth', '', 5, getActive)

  if (!activeKOTH || activeKOTH.whichRoo !== 'astro') {
    return
  }

  // TODO add to config or at least use named variables
  const earnings = bet.betAmount * 0.04 * 0.2
  const betWinRatio = (bet.payoutValue ?? 0) / bet.betAmount
  const newKing =
    activeKOTH.multiplier < betWinRatio && bet.betAmount >= activeKOTH.minBet

  if (newKing) {
    // new king of the god damn hill.
    updateKothById(activeKOTH._id, {
      currentUserId: userId,
      multiplier: betWinRatio,
    })
    logger.info(`New king of the hill: ${userId}`, { activeKOTH })

    const hidden = await getSystemSetting(userId, 'feed', 'incognito')
    const user = hidden
      ? { hidden: true, userId }
      : await getUserForDisplayById(userId)

    const gameIdentifier = convertTPHouseGameNameToGameIdentifier(
      bet.gameIdentifier ?? '',
    )

    const gameImage = gameIdentifier
      ? (await getGameSquareImages([gameIdentifier]))[gameIdentifier]
      : null

    io.emit('kothNewKing', {
      ...user,
      gameName: bet.gameNameDisplay ? bet.gameNameDisplay : bet.gameName,
      gameMult: betWinRatio,
      gameImage,
      gameIdentifier,
    })

    await updateKingForKothId(activeKOTH._id, userId, {
      gameName: bet.gameNameDisplay ? bet.gameNameDisplay : bet.gameName,
      gameMult: betWinRatio,
      gameImage,
      gameIdentifier,
    })
  }

  if (activeKOTH.currentUserId || newKing) {
    // reward whoever the current koth is.
    const kothConfig = await updateKothById(activeKOTH._id, {
      $inc: { earnings },
    })
    const user = await getUserById(newKing ? userId : activeKOTH.currentUserId)
    if (!user) {
      logger.error(`No user found with id: ${userId}`, { activeKOTH })
      return
    }
    const currentLeaderEarnings = await addEarnings(
      activeKOTH._id,
      newKing ? userId : activeKOTH.currentUserId,
      earnings,
    )

    await creditBalance({
      user,
      amount: earnings,
      meta: {
        // TODO repair KOTH interface
        kothId: activeKOTH._id.toString(),
      },
      transactionType: 'koth',
      balanceTypeOverride: 'crypto',
    })

    const emit = await BasicCache.get('koth', 'emit')
    if (!emit) {
      io.emit('kothUpdate', {
        config: kothConfig,
        currentLeaderEarnings,
      })
      BasicCache.set('koth', 'emit', true, 1)
    }
  }
}

type KothDisplayUser = { hidden?: boolean } & Partial<UserTypes.DisplayUser>
interface KothLeaderboard {
  config: {
    active: boolean
    showKoth: boolean
  }
  currentKing: {
    earnings: KothEarnings | null
    user: KothDisplayUser & { userId: string }
  }
  leaderboard: Array<KothEarnings & { user: KothDisplayUser }>
}

interface KOTHEarningsResponse {
  lifeTime: number
  latest: number
}

export const getUserKOTHEarnings = async (
  transactions: Array<Transaction<'koth'>>,
): Promise<KOTHEarningsResponse> => {
  const payload = {
    lifeTime: 0,
    latest: 0,
  }
  payload.lifeTime = transactions.reduce((acc, obj) => {
    return acc + obj.amount
  }, 0)

  const latestKOTH = await getMostRecentKOTH()
  const latestKOTHs = transactions.filter(transaction => {
    // TODO repair KOTH interface
    return transaction.meta?.kothId === latestKOTH?._id.toString()
  })
  payload.latest = latestKOTHs.reduce((acc, obj) => {
    return acc + obj.amount
  }, 0)
  return payload
}

export const trimForFrontend = async (
  isStaff: boolean,
  requestingUserId?: string,
) => {
  const shouldHide = (rowUserId: string | undefined, hidden: boolean) =>
    hidden && !isStaff && requestingUserId !== rowUserId

  const payload = await BasicCache.cached(
    'koth/get',
    '',
    10,
    processLeaderboard,
  )
  const { currentKing, leaderboard = [] } = payload

  const trimmedCurrentKing = currentKing
    ? shouldHide(currentKing.user.userId, !!currentKing.user.hidden)
      ? {
          ...currentKing.earnings,
          hidden: true,
          userId: currentKing.user.userId,
        }
      : { ...currentKing.earnings, ...currentKing.user, hidden: false }
    : undefined

  const trimmedLeaderboard = leaderboard.map(row => ({
    ...row,
    user: shouldHide(row.user.id, !!row.user.hidden)
      ? { hidden: true }
      : { ...row.user, hidden: false },
  }))

  return {
    ...payload,
    leaderboard: trimmedLeaderboard,
    currentKing: trimmedCurrentKing,
  }
}

async function processLeaderboard(): Promise<Partial<KothLeaderboard>> {
  const latestKOTH = await getLooming()

  if (!latestKOTH) {
    return {
      config: {
        active: false,
        showKoth: false,
      },
    }
  }

  const payload: Partial<KothLeaderboard> = {
    config: {
      ...latestKOTH,
      active: latestKOTH.isActive,
      showKoth: true,
    },
  }

  if (latestKOTH.currentUserId) {
    const hidden = await getSystemSetting(
      latestKOTH.currentUserId,
      'feed',
      'incognito',
    )
    const displayUser = await getUserForDisplayById(latestKOTH.currentUserId)
    const user = { ...displayUser, hidden, userId: latestKOTH.currentUserId }
    const earnings = await getKingForKothId(
      latestKOTH._id,
      latestKOTH.currentUserId,
    )
    payload.currentKing = { earnings, user }
  }

  const topKings = await getTopKingsForKothId(latestKOTH._id)

  payload.leaderboard = (
    await Promise.all(
      topKings.map(async row => {
        if (row.userId) {
          const user = await getUserById(row.userId)
          if (user) {
            const displayUser = await getUserForDisplay(user)
            const hidden: boolean = await getSystemSetting(
              user.id,
              'feed',
              'incognito',
            )
            return { ...row, user: { ...displayUser, hidden } }
          } else {
            return { ...row, user: { hidden: true } }
          }
        }
      }),
    )
  ).filter(exists)

  return payload
}
