import 'core-js/stable'
import 'regenerator-runtime/runtime'

import { type ChangeEvent } from 'rethinkdbdash'
import { config } from 'src/system/config'
import { winston } from 'src/system/logger'
import { type CrashGame } from 'src/modules/crash/documents/crash_game'
import { type CrashBet } from 'src/modules/crash/lib/helpers/crash_bet'
import { r } from 'src/system'

import { StateIds } from './constants'
import { getLatestCrashGame } from './lib/helpers'
import { watchRethinkDBChanges } from './lib/util'
import { crashLogger } from './lib/logger'
import { CrashGameServer } from './CrashGameServer'
import { type ActiveBet } from '../bet/types'

export class CrashGameServerOrchestrator {
  previousGame: CrashGame | null
  server: CrashGameServer

  constructor() {
    this.server = new CrashGameServer()

    // Previous Crash game.
    this.previousGame = null
  }

  async start() {
    crashLogger('start', { userId: null }).debug('Starting crash game server.')

    // Listen for crash game changes
    this.watchCrashGames()

    // Listen for crash bet changes
    this.watchCrashBets()
  }

  processGameChange(game: CrashGame) {
    // Ignore if missing game or if it seems to of went backwards (Which should never happen)
    if (
      !game ||
      (!!this.previousGame && game.index < this.previousGame.index)
    ) {
      return
    }

    // Stop any active ticks
    this.server.stopTicks()

    // Set previous game.
    this.previousGame = game

    // Post new crash game to websocket connections.
    this.server.updateCrash({
      id: game.id,
      hash: game.hash,
      state: StateIds[game.state],
      bettingEndTime: game.bettingEndTime,
      runningStartTime: game.runningStartTime,
      crashPoint: game.crashPoint,
    })

    // Start ticking
    if (game.state === 'Running') {
      this.server.startTicks(game.runningStartTime, game.crashPoint)
    }

    crashLogger('processGameChange', { userId: null }).debug(
      `Crash game (${game.id}) has changed to ${game.state}`,
      { gameId: game.id, gameState: game.state },
    )
  }

  watchCrashGames() {
    const getChanges = () => {
      return r
        .table<CrashGame>('crash_games')
        .changes()
        .then((cursor: unknown) => {
          // Refresh the current game manually whenever we connect to the feed
          getLatestCrashGame().then(([game]: CrashGame[]) => {
            this.processGameChange(game)
          })

          return cursor
        })
    }

    const onChange = (changes: ChangeEvent<CrashGame>) => {
      if (!!changes && !!changes.new_val) {
        this.processGameChange(changes.new_val)
      }
    }

    watchRethinkDBChanges<CrashGame>(getChanges, onChange, {
      ...config.rethinkdb.changefeedReconnectOptions,
      changefeedName: 'CrashGames',
      logger: winston,
    })
  }

  watchCrashBets() {
    const getChanges = async () => {
      return await r
        .table<ActiveBet>('active_bet')
        .getAll('crash', { index: 'gameName' })
        .changes()
        .run()
    }

    const onChange = (changes: ChangeEvent<CrashBet>) => {
      if (!changes || !changes.new_val) {
        return
      }

      // Looking for new bets or closed out changes
      if (
        !changes.old_val ||
        (!!changes.old_val &&
          changes.new_val.closedOut !== changes.old_val.closedOut)
      ) {
        const crashBet = changes.new_val

        this.server.updateCrashBet(
          crashBet.closedOut
            ? {
                closedOut: crashBet.closedOut,
                userId: crashBet.userId,
                cashoutCrashPoint: crashBet.cashoutCrashPoint,
                upgradeItems: crashBet.upgradeItems,
                payoutValue: crashBet.payoutValue,
              }
            : {
                closedOut: crashBet.closedOut,
                balanceType: crashBet.balanceType,
                betAmount: crashBet.betAmount,
                incognito: crashBet.incognito,
                id: crashBet.id,
                user: crashBet.user,
                userId: crashBet.userId,
              },
        )
      }
    }

    watchRethinkDBChanges<CrashBet>(getChanges, onChange, {
      ...config.rethinkdb.changefeedReconnectOptions,
      changefeedName: 'CrashBets',
      logger: winston,
    })
  }
}
