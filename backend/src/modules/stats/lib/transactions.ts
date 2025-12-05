import { type AsyncOrSync, type DeepReadonly } from 'ts-essentials'

import { recordBetsAllTime } from 'src/modules/siteSettings'
import { getGame, type TPGame } from 'src/modules/tp-games/documents/games'
import {
  getUserById,
  incrementTotalTipped,
  incrementTotalTipsReceived,
  recordStatForUser,
  updateUser,
  updateUserBetStats,
  updateUserSportsBetStats,
} from 'src/modules/user'
import {
  type TransactionMeta,
  type TransactionType,
} from 'src/modules/user/documents/transaction'
import { type BalanceType, type User } from 'src/modules/user/types'
import { r } from 'src/system'
import { isPositiveNumber, type PositiveNumber } from 'src/util/helpers/number'

import { recordDailyGlobalStat } from '../documents/stats'
import { recordUserStats } from '../documents/userStats'
import {
  incrementUniqueStat,
  recordStat,
  recordStats,
  writeWithdrawalStats,
  writeBetStats,
  writeWinStats,
  writeDepositStats,
} from './userEventStatUpdates'
import { getMatchPromoForUser } from 'src/modules/promo/documents/match_promo'
import { statsLogger } from './logger'

interface TransactionMapParams<Type extends TransactionType> {
  transactionType: Type
  amount: PositiveNumber
  meta: TransactionMeta[Type]
  user: User
  balanceType: BalanceType
}

type TransactionMap = DeepReadonly<{
  [key in TransactionType]: (params: TransactionMapParams<key>) => AsyncOrSync<{
    /** Conditionally update stat values on the User record. */
    statWrites?: () => Promise<void>
  }>
}>

interface WriteStatsForTransaction<Type extends TransactionType> {
  amount: number
  transactionType: Type
  meta: TransactionMeta[Type]
  userId: string
  balanceType: BalanceType
}

// Until all Betsy sportsbetting bets are close, we need to support it.
const SPORTSBOOK_GAME_IDS: readonly string[] = [
  'hub88:btsg_sportbetting',
  'slotegrator:sportsbook-1',
]

const isSportsbookGame = (gameIdentifier: string): boolean => {
  return !!SPORTSBOOK_GAME_IDS.includes(gameIdentifier)
}

const statWritesDisabled = async (userId: string, balanceType: BalanceType) => {
  const promo = await getMatchPromoForUser(userId)
  return promo && !promo.canWithdraw && promo.balanceType === balanceType
}

/**
 * Do our very best to determine the state game name. If for some reason
 * none of this data is available, return unknown.
 */
const getGameName = (
  tpGame: TPGame | null,
  meta: TransactionMeta['bet' | 'payout'],
): string => {
  const logger = statsLogger('getGameName', { userId: null })
  if (meta.gameIdentifiers.gameName) {
    return meta.gameIdentifiers.gameName
  }

  if (!tpGame) {
    logger.error('Unknown Game', { meta, tpGame })
    return 'unknownGame'
  }

  if (isSportsbookGame(tpGame.identifier)) {
    return 'sportsbook'
  }

  if (tpGame.aggregator) {
    return tpGame.aggregator
  }

  if (!meta.gameIdentifiers.aggregator && !meta.gameIdentifiers.identifier) {
    logger.error('Unknown Third Party Game', { meta, tpGame })
  }

  return (
    meta.gameIdentifiers.aggregator ??
    meta.gameIdentifiers.identifier ??
    'unknownThirdPartyGame'
  )
}

// TODO: Move this and helpers to separate files.
const TRANSACTION_MAP: TransactionMap = {
  bet: async params => {
    const tpGame = !params.meta.gameIdentifiers.gameName
      ? await getGame(params.meta.gameIdentifiers)
      : null

    const gameName = getGameName(tpGame, params.meta)

    return {
      statWrites: async () => {
        const { user, amount, balanceType } = params
        const disableWrite = await statWritesDisabled(user.id, balanceType)
        if (disableWrite) return

        await Promise.allSettled([
          writeBetStats(user, gameName, amount),
          recordBetsAllTime(amount),
          incrementUniqueStat(user, 'uniqueBets', 1),
          updateUserBetStats(user.id, amount, 0),
          gameName === 'sportsbook'
            ? updateUserSportsBetStats(user.id, amount, 0)
            : undefined,
        ])
      },
    }
  },

  refund: async params => {
    const tpGame = !params.meta.gameIdentifiers.gameName
      ? await getGame(params.meta.gameIdentifiers)
      : null

    const gameName = getGameName(tpGame, params.meta)

    return {
      statWrites: async () => {
        const { user, amount } = params

        await Promise.allSettled([
          writeBetStats(user, gameName, -amount),
          updateUserBetStats(user.id, -amount, 0),
          gameName === 'sportsbook'
            ? updateUserSportsBetStats(user.id, -amount, 0)
            : undefined,
        ])
      },
    }
  },

  deposit: async params => {
    return {
      statWrites: async () => {
        const { user, amount, balanceType } = params
        await updateUser(user.id, {
          totalDeposited: r.row('totalDeposited').add(amount).default(amount),
          totalDeposits: r.row('totalDeposits').add(1).default(1),
          hiddenTotalDeposited: r
            .row('hiddenTotalDeposited')
            .add(amount)
            .default(amount),
          hiddenTotalDeposits: r.row('hiddenTotalDeposits').add(1).default(1),
        })
        await writeDepositStats(user, amount, balanceType)
        await incrementUniqueStat(user, 'uniqueDeposits', 1)
      },
    }
  },

  payout: async params => {
    const tpGame = !params.meta.gameIdentifiers.gameName
      ? await getGame(params.meta.gameIdentifiers)
      : null

    const gameName = getGameName(tpGame, params.meta)

    return {
      statWrites: async () => {
        const { user, amount, balanceType } = params
        const disableWrite = await statWritesDisabled(user.id, balanceType)

        if (disableWrite) return

        await Promise.allSettled([
          writeWinStats(user, gameName, amount),
          updateUserBetStats(user.id, 0, amount),
          gameName === 'sportsbook'
            ? updateUserSportsBetStats(user.id, 0, amount)
            : undefined,
        ])
      },
    }
  },

  winRollback: async params => {
    const tpGame = !params.meta.gameIdentifiers.gameName
      ? await getGame(params.meta.gameIdentifiers)
      : null

    const gameName = getGameName(tpGame, params.meta)

    return {
      statWrites: async () => {
        const { user, amount } = params

        await Promise.allSettled([
          updateUserBetStats(user.id, 0, -amount),
          gameName === 'sportsbook'
            ? updateUserSportsBetStats(user.id, 0, -amount)
            : undefined,
        ])
      },
    }
  },

  marketingBonus: params => ({
    statWrites: async () => {
      const { user, amount } = params

      await Promise.allSettled([
        recordStat(user, { key: 'marketingBonus', amount }, true),
        updateUser(user.id, {
          marketingBonus: r.row('marketingBonus').add(amount).default(amount),
        }),
      ])
    },
  }),

  bonus: params => ({
    statWrites: async () => {
      const { user, amount } = params

      await Promise.allSettled([
        recordStat(user, { key: 'manualBonuses', amount }, true),
        updateUser(user.id, {
          manualBonuses: r.row('manualBonuses').add(amount).default(amount),
          lastManualBonus: r.now(),
        }),
      ])
    },
  }),

  affiliate: params => ({
    statWrites: async () => {
      const { user, amount, balanceType, meta } = params

      await Promise.allSettled([
        // TODO batch these after adding override to the interface of recordStats
        recordStat(user, { key: 'refEarnings', amount, balanceType }, false),
        recordStat(user, { key: 'affiliateEarningsPaid', amount }, true),
        // Record general, and currency-specific total.
        recordUserStats(user, [
          { key: 'affiliatesTotalWagered', amount: meta.betAmount },
          {
            key: 'affiliatesTotalWagered',
            amount: meta.betAmount,
            balanceType,
          },
        ]),
      ])
    },
  }),

  survey: params => ({
    statWrites: async () => {
      const { user, amount } = params

      await Promise.allSettled([
        recordDailyGlobalStat({ key: 'offerDeposits', amount: 1 }),
        recordDailyGlobalStat({ key: 'offerDeposited', amount }),
        recordStatForUser(user.id, 'offerDeposits', 1),
        recordStatForUser(user.id, 'offerDeposited', amount),
        updateUser(user.id, {
          surveyCredited: r.row('surveyCredited').add(amount).default(amount),
        }),
      ])
    },
  }),

  promo: params => ({
    statWrites: async () => {
      const { user, amount } = params

      await Promise.allSettled([
        recordStats(user, [
          { key: 'promoClaims', amount: 1 },
          { key: 'promoClaimed', amount },
        ]),
        updateUser(user.id, {
          promosClaimed: r.row('promosClaimed').add(1).default(1),
          lastPromoClaimed: r.now(),
        }),
      ])
    },
  }),

  roowardsReload: params => ({
    statWrites: async () => {
      const { user, amount } = params

      await Promise.allSettled([
        recordStats(user, [
          { key: 'roowardReloadClaims', amount: 1 },
          { key: 'roowardReloadClaimed', amount },
        ]),
        updateUser(user.id, {
          rechargeClaimed: r.row('rechargeClaimed').add(amount).default(amount),
        }),
      ])
    },
  }),

  tip: async params => {
    return {
      statWrites: async () => {
        const { user, amount } = params

        // Sender.
        if ('toName' in params.meta) {
          await Promise.allSettled([
            incrementTotalTipped(user.id, amount),
            recordStat(user, { key: 'tipped', amount }, true),
          ])
        }

        // Receiver.
        if ('fromName' in params.meta) {
          await Promise.allSettled([
            incrementTotalTipsReceived(user.id, `${amount}`),
            recordStat(user, { key: 'tipsReceived', amount }, true),
          ])
        }
      },
    }
  },

  roowards: params => ({
    statWrites: async () => {
      const { user, amount } = params

      await Promise.allSettled([
        recordStats(user, [
          { key: 'roowardsClaims', amount: 1 },
          { key: 'roowardsClaimed', amount },
        ]),
        updateUser(user.id, {
          roowardsClaimed: r.row('roowardsClaimed').add(amount).default(amount),
        }),
      ])
    },
  }),

  rain: async params => {
    return {
      statWrites: async () => {
        const { user, amount } = params

        // Creator.
        if (params.meta.creator) {
          await Promise.allSettled([
            recordStat(user, { key: 'rainCount', amount: 1 }, true),
          ])
        }

        // Receiver.
        if (!params.meta.creator) {
          await Promise.allSettled([
            recordStat(user, { key: 'rainTotal', amount }, true),
            updateUser(user.id, {
              rainCredited: r.row('rainCredited').add(amount).default(amount),
            }),
          ])
        }
      },
    }
  },

  withdrawal: async params => ({
    statWrites: async () => {
      const { amount, user, balanceType } = params
      await writeWithdrawalStats(user, amount, balanceType)
    },
  }),

  // All the transaction types below don't currently need to record stats
  adminAddBalance: () => ({
    statWrites: async () => undefined,
  }),
  promoBuyin: () => ({
    statWrites: async () => undefined,
  }),
  cancelledWithdrawal: () => ({
    statWrites: async () => undefined,
  }),
  adminSetBalance: () => ({
    statWrites: async () => undefined,
  }),
  declinedWithdrawal: () => ({
    statWrites: async () => undefined,
  }),
  matchPromo: () => ({
    statWrites: async () => undefined,
  }),
  depositBonus: () => ({
    statWrites: async () => {
      await Promise.resolve()
    },
  }),
  koth: () => ({
    statWrites: async () => undefined,
  }),
  'early abort match promo': () => ({
    statWrites: async () => undefined,
  }),
  raffle: () => ({
    statWrites: async () => undefined,
  }),
  roulette_jackpot_win: () => ({
    statWrites: async () => undefined,
  }),
  prizeDrop: () => ({
    statWrites: async () => undefined,
  }),
  emberTransfer: () => ({
    statWrites: async () => undefined,
  }),
} as const

export const writeStatsForTransaction = async <T extends TransactionType>(
  txInput: WriteStatsForTransaction<T>,
) => {
  const { transactionType, meta, userId, balanceType } = txInput
  const logger = statsLogger('writeStatsForTransaction', { userId })

  const user = await getUserById(userId)
  if (!user) {
    return
  }

  const schema = TRANSACTION_MAP[transactionType]

  if (!schema) {
    return
  }

  // All amounts should be positive when passed to schema.
  // Debit transactions will have negative amount inputs.
  const amount = Math.abs(txInput.amount)
  if (!isPositiveNumber(amount)) {
    return
  }

  const { statWrites } = await schema({
    amount,
    meta,
    transactionType,
    user,
    balanceType,
  })

  // Write stat updates, if defined.
  if (statWrites) {
    try {
      await statWrites()
    } catch (error) {
      logger.error(
        'Failed to write stat update for given transaction.',
        { txInput },
        error,
      )
    }
  }
}
