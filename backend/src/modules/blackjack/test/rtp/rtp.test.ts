/**
 * Blackjack RTP tests
 *
 * @group blackjack/rtp
 * @group rtp
 * @group housegame
 */
import * as cacheLib from '../../../../util/redisModels/basicCache'
import * as betLib from '../../../bet'
import * as activeBetLib from '../../../bet/documents/active_bet'
import { saltWithClientSeed } from '../../../game/lib/provably_fair/sharedAlgorithms'
import { generateRoundHash } from '../../../game/lib/provably_fair/userGenerated'
import * as roundsLib from '../../../game/lib/round'
import * as balanceLib from '../../../user/balance/lib'
import * as userLib from '../../../user/documents/user'
import { BlackjackGameModel } from '../../documents/blackjackGames'
import { BlackjackGameHistoryModel } from '../../documents/blackjackHistory'
import {
  BLACKJACK_GAME_NAME,
  HandWagerType,
  isPlayerSeatWithLiveHandWagers,
  type GameState,
} from '../../lib'
import { getMockedLogger, getObjectIdValue } from '../utils'
import { PlayerOptimal } from './player'
import {
  isDataOperation,
  isDataOperationNumber,
  isDataOperationObject,
  merge,
  reduceBlackjackRTPStats,
  type BlackjackRTPGameStats,
  type BlackjackRtpTest,
} from './types'

describe.skip('Blackjack RTP Tests', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases: BlackjackRtpTest[] = [
    {
      name: 'Calculate Optimal Play',
      inputs: {
        rounds: 10000,
        playerFactory: (playerId, wagers, betProfit) => {
          return new PlayerOptimal(playerId, wagers, betProfit)
        },
        wagersFactory: () => {
          return [
            {
              amount: 1000,
              handIndex: 0,
              type: HandWagerType.Main,
              /* sides: [
                {
                  amount: 100,
                  type: HandWagerType.PerfectPair,
                  outcome: WagerOutcomeType.Unknown,
                },
                {
                  amount: 100,
                  type: HandWagerType.TwentyOnePlusThree,
                  outcome: WagerOutcomeType.Unknown,
                },
              ], */
            },
          ]
        },
      },
      expects: {
        rtp: 98,
        range: 1.5,
      },
    },
  ]

  it.each(cases)(
    '$name',
    async ({ inputs, expects }) => {
      const { rounds, playerFactory, wagersFactory } = inputs
      const { rtp, range } = expects

      // Validate inputs
      expect(rounds).toBeGreaterThan(0)
      expect(expects.rtp).toBeGreaterThan(0)
      expect(expects.range).toBeGreaterThanOrEqual(0)

      // Mock all the things!!
      mockEverythingBlackjack()

      // Silence the logs with a mock
      getMockedLogger()

      // Create games and players
      const betAccessor = (betId?: string): [number, number] => {
        if (!betId || betId === '') {
          return [0, 0]
        }
        const bet = bets[betId]
        return bet ? [bet.betAmount, bet.payoutValue ?? 0] : [0, 0]
      }

      // Run test & gather results
      const results: BlackjackRTPGameStats[] = []
      for (let i = 0; i < rounds; i++) {
        const player = playerFactory(
          getObjectIdValue(),
          wagersFactory(),
          betAccessor,
        )
        const playerResults = await player.getGameResults()
        results.push(playerResults)
      }
      const stats = reduceBlackjackRTPStats(results)

      // Validate results
      expect(stats.hands.total).toBeGreaterThan(0)
      expect(stats.hands.won).toBeGreaterThanOrEqual(0)
      expect(stats.hands.won).toBeLessThanOrEqual(stats.hands.total)

      expect(stats.perfectPairs.total).toBeGreaterThanOrEqual(0)
      expect(stats.perfectPairs.won).toBeGreaterThanOrEqual(0)
      expect(stats.perfectPairs.won).toBeLessThanOrEqual(
        stats.perfectPairs.total,
      )

      expect(stats.twentyOnePlusThree.total).toBeGreaterThanOrEqual(0)
      expect(stats.twentyOnePlusThree.won).toBeGreaterThanOrEqual(0)
      expect(stats.twentyOnePlusThree.won).toBeLessThanOrEqual(
        stats.twentyOnePlusThree.total,
      )

      expect(stats.insurance.total).toBeGreaterThanOrEqual(0)
      expect(stats.insurance.won).toBeGreaterThanOrEqual(0)
      expect(stats.insurance.won).toBeLessThanOrEqual(stats.insurance.total)

      // Validate RTP
      const rtpOverall = (stats.hands.profit / stats.hands.wagered) * 100
      stats.rtp = rtpOverall
      // fs.writeFileSync(rtpOutputPath, JSON.stringify(stats, null, 2))
      expect(rtpOverall).toBeGreaterThanOrEqual(rtp - range)
      expect(rtpOverall).toBeLessThanOrEqual(rtp + range)
    },
    180000,
  )
})

// Unexported types
interface BalanceReturn {
  balance: number
  balanceType: string
}
interface BalanceTransaction extends BalanceReturn {
  transactionId: string
  transactionType: string
}

// Memory storage
const games: Record<string, GameState> = {}
const cache: Record<string, GameState> = {}
const history: Record<string, GameState> = {}
const bets: Record<string, betLib.Types.ActiveBet> = {}
const userBalance: BalanceReturn = { balance: 10000000, balanceType: 'eth' }
const transactions: Record<string, BalanceTransaction> = {}

/**
 * Simulate the disconnect between the client and the server.
 * @param obj The object to be disconnected.
 * @returns A deep copy of the object.
 */
function wireEffects<T extends object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Mock everything related to blackjack for RTP testing.
 *
 * Expect to find virtual IO and lots of other fun goodies in here.
 */
function mockEverythingBlackjack(): void {
  // Game Model mocks
  BlackjackGameModel.create = jest.fn(game => {
    if (!game.id || game.id === '') {
      game.id = getObjectIdValue()
    }
    games[game.id] = game
    return Promise.resolve({ toObject: () => wireEffects(game) })
  })
  BlackjackGameModel.updateOne = jest.fn((query, data, _o) => {
    games[query._id] = wireEffects({ ...games[query._id], ...data })
    return Promise.resolve({ acknowledged: true })
  })
  BlackjackGameModel.find = jest.fn(query => {
    const playerId = query['players.playerId']
    const results = Object.values(games).filter(game =>
      game.players.some(player => player.playerId === playerId),
    )
    return Promise.resolve(
      results.map(game => ({ toObject: () => wireEffects(game) })),
    )
  })
  BlackjackGameModel.findById = jest.fn(id =>
    Promise.resolve({ toObject: () => wireEffects(games[id]) }),
  )
  BlackjackGameModel.deleteOne = jest.fn(query => {
    const deleted = Reflect.deleteProperty(games, query._id)
    return Promise.resolve({
      acknowledged: deleted,
      deletedCount: deleted ? 1 : 0,
    })
  })

  // History Model mocks
  BlackjackGameHistoryModel.insertMany = jest.fn(games => {
    games.forEach(game => {
      history[game.id] = wireEffects(game)
    })
    return Promise.resolve(
      games.map(game => ({ toObject: () => wireEffects(game) })),
    )
  })
  BlackjackGameHistoryModel.findOne = jest.fn(query => {
    const betId = query.players?.$elemMatch?.betId
    const record = Object.values(history).find(game =>
      game.players
        .filter(isPlayerSeatWithLiveHandWagers)
        .some(player => player.betId === betId),
    )
    if (!record) {
      return Promise.reject(new Error('Game not found'))
    }
    return Promise.resolve({ toObject: () => wireEffects(record) })
  })
  BlackjackGameHistoryModel.countDocuments = jest.fn(query => {
    const playerId = query.players?.$elemMatch?.playerId
    const results = Object.values(history).filter(game =>
      game.players.some(player => player.playerId === playerId),
    )
    return Promise.resolve(results.length)
  })
  BlackjackGameHistoryModel.find = jest.fn(query => {
    const playerId = query.players?.$elemMatch?.playerId
    const results = Object.values(history).filter(game =>
      game.players.some(player => player.playerId === playerId),
    )
    return Promise.resolve({
      skip: (_o: number) => ({
        limit: (_l: number) => ({ toObject: () => wireEffects(results) }),
      }),
    })
  })

  // Cache mocks
  jest
    .spyOn(cacheLib, 'set')
    .mockImplementation(async (name, key, game, _seconds) => {
      const finalKey = `${name}:${key}`
      cache[finalKey] = wireEffects(game)
    })
  jest
    .spyOn(cacheLib, 'cached')
    .mockImplementation(async (name, key, _seconds, query) => {
      const finalKey = `${name}:${key}`
      if (cache[finalKey]) {
        return wireEffects(cache[finalKey])
      }
      const result = await query()
      if (!result) {
        return null
      }
      cache[finalKey] = wireEffects(result) as GameState
      return cache[finalKey]
    })
  jest.spyOn(cacheLib, 'invalidate').mockImplementation(async (name, key) => {
    const finalKey = `${name}:${key}`
    Reflect.deleteProperty(cache, finalKey)
  })

  // Bet mocks
  jest
    .spyOn(betLib, 'placeBet')
    .mockImplementation(
      async ({
        user,
        game,
        betAmount,
        extraBetFields,
        balanceTypeOverride,
      }) => {
        const betId = getObjectIdValue()
        bets[betId] = {
          id: betId,
          ...extraBetFields,
          balanceType: balanceTypeOverride ?? 'eth',
          closedOut: false,
          gameId: game.id,
          gameName: game.gameName,
          gameIdentifier: 'house:blackjack',
          userId: user.id,
          betAmount,
          highroller: betAmount > 100,
          timestamp: new Date(),
          incognito: false,
          twoFactor: false,
          user,
        }
        return bets[betId]
      },
    )

  jest.spyOn(betLib, 'refundBet').mockImplementation(async (bet, _gameName) => {
    Reflect.deleteProperty(bets, bet.id)
  })

  // Active Bet mocks
  jest
    .spyOn(activeBetLib, 'getActiveBetById')
    .mockImplementation(async betId => {
      return !betId ? null : bets[betId] ?? null
    })

  jest
    .spyOn(activeBetLib, 'updateActiveBetForUser')
    .mockImplementation(async (userId, betId, updateFields) => {
      try {
        Object.values(updateFields)
          .filter(isDataOperationNumber)
          .forEach(({ field, data }) => {
            bets[betId][field] += data
          })
        Object.values(updateFields)
          .filter(isDataOperationObject)
          .forEach(({ field, data }) => {
            const merged = merge(bets[betId][field], data)
            bets[betId][field] = merged
          })
        const finalPatch = Object.keys(updateFields)
          .filter(key => !isDataOperation(updateFields[key]))
          .reduce((a, b) => ({ ...a, [b]: updateFields[b] }), {})

        bets[betId] = { ...bets[betId], ...finalPatch }
      } catch (err) {
        return { errors: 1, first_error: err }
      }
      return { errors: 0 }
    })

  jest
    .spyOn(activeBetLib, 'prepareAndCloseoutActiveBet')
    .mockImplementation(async (activeBet, deleteAfterRecord) => {
      const betId = activeBet.id
      const finalBet = {
        ...activeBet,
        betId: activeBet.id,
        won: activeBet.payoutValue ? activeBet.payoutValue > 0 : false,
        profit: (activeBet.payoutValue ?? 0) - activeBet.betAmount,
        attempts: 0,
        closedOut: true,
        paidOut: false,
        ranHooks: false,
        closeoutComplete: false,
        deleteAfterRecord,
        handWagers: (bets[betId] as any).handWagers,
      }
      bets[betId] = finalBet
      return finalBet
    })

  // Balance mocks
  jest
    .spyOn(balanceLib, 'getSelectedBalanceFromUser')
    .mockImplementation(async _ => {
      return userBalance
    })

  jest
    .spyOn(balanceLib, 'deductFromBalance')
    .mockImplementation(async ({ amount, transactionType }) => {
      const transactionId = getObjectIdValue()
      userBalance.balance -= amount
      transactions[transactionId] = {
        transactionId,
        transactionType,
        balance: userBalance.balance,
        balanceType: userBalance.balanceType,
      }
      return transactions[transactionId]
    })

  // Game Rounds mocks
  jest
    .spyOn(roundsLib, 'startNewRound')
    .mockImplementation(async (user, gameName, clientSeedArg) => {
      const nonce = Math.floor(Math.random() * 10)
      const roundId = Math.floor(Math.random() * 10)
      const clientSeed = clientSeedArg || `clientSeed-${user.id}`
      const noncedSeed = `${clientSeed} - ${nonce}`
      const { secretHash: roundHash } = generateRoundHash(
        gameName,
        roundId.toString(),
      )
      const hash = saltWithClientSeed(roundHash, noncedSeed)
      return {
        hash,
        provablyFairInfo: {
          clientSeed,
          newRound: true,
          roundStartInfo: { hash, previousRoundSeed: null },
          currentRound: {
            id: roundId.toString(),
            _id: roundId.toString(),
            gameName: BLACKJACK_GAME_NAME,
            hash,
            seed: null,
            nonce,
            timestamp: new Date().toISOString(),
          },
        },
      }
    })

  // User mocks
  jest.spyOn(userLib, 'getUserById').mockImplementation(async userId => {
    return {
      id: userId,
      kycRequiredLevel: 0,
      selectedBalanceType: 'eth',
    }
  })
}
