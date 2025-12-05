import 'core-js/stable'
import 'regenerator-runtime/runtime'

import { type ChangeEvent } from 'rethinkdbdash'
import { config } from 'src/system/config'
import { winston } from 'src/system/logger'
import { instrument } from 'src/util/trace'

import { StateIds } from './constants'
import { getLatestHotboxGame } from './lib/helpers'
import { watchRethinkDBChanges } from './lib/util'
import { HotboxGameServer } from './HotboxGameServer'

import { type HotboxGame } from './documents/hotbox_game'
import { type HotboxBet } from './lib/helpers/hotbox_bet'
import { r } from 'src/system'
import { type ActiveBet } from '../bet/types'
import { hotboxLogger } from './lib/logger'

export class HotboxGameServerOrchestrator {
  previousGame: HotboxGame | null
  server: HotboxGameServer
  r: any
  name: string
  worker: string

  constructor(name: string) {
    this.server = new HotboxGameServer()
    this.r = r
    this.name = name
    this.worker = 'w-' + name.toLowerCase()

    // Previous Hotbox game.
    this.previousGame = null
  }

  async start() {
    hotboxLogger('GameServerOrchestrator/start', { userId: null }).debug(
      'Starting hotbox game server.',
    )

    // Listen for hotbox game changes.
    this.watchHotboxGames()

    // Listen for hotbox bet changes
    this.watchHotboxBets()
  }

  processGameChange(game: HotboxGame) {
    // Ignore if missing game or if it seems to of went backwards (Which should never happen)
    if (
      !game ||
      (!!this.previousGame && game.index < this.previousGame.index)
    ) {
      return
    }

    instrument('processGameChange', this.worker, async () => {
      // Stop any active ticks
      this.server.stopTicks()

      // Set previous game.
      this.previousGame = game

      // Post new hotbox game to websocket connections.
      this.server.updateHotbox({
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

      hotboxLogger('GameServerOrchestrator/processGameChange', {
        userId: null,
      }).debug(`Hotbox game (${game.id}) has changed to ${game.state}`, {
        id: game.id,
        state: StateIds[game.state],
        bettingEndTime: game.bettingEndTime,
        runningStartTime: game.runningStartTime,
        crashPoint: game.crashPoint,
      })
    })
  }

  watchHotboxGames() {
    const getChanges = () => {
      return this.r
        .table('hotbox_games')
        .changes()
        .then((cursor: unknown) => {
          // Refresh the current game manually whenever we connect to the feed
          getLatestHotboxGame(this.r).then(([game]: HotboxGame[]) => {
            this.processGameChange(game)
          })

          return cursor
        })
    }

    const onChange = (changes: ChangeEvent<HotboxGame>) => {
      if (!!changes && !!changes.new_val) {
        this.processGameChange(changes.new_val)
      }
    }

    watchRethinkDBChanges<HotboxGame>(getChanges, onChange, {
      ...config.rethinkdb.changefeedReconnectOptions,
      changefeedName: 'HotboxGames',
      logger: winston,
    })
  }

  watchHotboxBets() {
    const getChanges = () => {
      // @ts-expect-error fix "this" for correct typing
      return this.r
        .table<ActiveBet>('active_bet')
        .getAll('hotbox', { index: 'gameName' })
        .changes()
        .run()
    }

    const onChange = (changes: ChangeEvent<HotboxBet>) => {
      if (!changes || !changes.new_val) {
        return
      }

      instrument('HotboxBet', this.worker, async () => {
        // Looking for new bets or closed out changes
        if (
          !changes.old_val ||
          (!!changes.old_val &&
            changes.new_val.closedOut !== changes.old_val.closedOut)
        ) {
          const hotboxBet = changes.new_val

          this.server.updateHotboxBet(
            hotboxBet.closedOut
              ? {
                  closedOut: hotboxBet.closedOut,
                  userId: hotboxBet.userId,
                  cashoutCrashPoint: hotboxBet.cashoutCrashPoint,
                  upgradeItems: hotboxBet.upgradeItems,
                  payoutValue: hotboxBet.payoutValue,
                }
              : {
                  closedOut: hotboxBet.closedOut,
                  balanceType: hotboxBet.balanceType,
                  betAmount: hotboxBet.betAmount,
                  incognito: hotboxBet.incognito,
                  id: hotboxBet.id,
                  user: hotboxBet.user,
                  userId: hotboxBet.userId,
                },
          )
        }
      })
    }

    watchRethinkDBChanges<HotboxBet>(getChanges, onChange, {
      ...config.rethinkdb.changefeedReconnectOptions,
      changefeedName: 'HotboxBets',
      logger: winston,
    })
  }
}
