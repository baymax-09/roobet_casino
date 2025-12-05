import 'core-js/stable'
import 'regenerator-runtime/runtime'

import 'src/system/config'
import { WebsocketMessage } from 'src/util/io/WebsocketMessage'

import {
  StateIds,
  OverState,
  TickMessageId,
  UpdateCrashMessageId,
  UpdateCrashBetMessageId,
} from './constants'
import { CrashTicker } from './CrashTicker'

import { type CrashBet } from 'src/modules/crash/lib/helpers/crash_bet'
import { type CrashGame } from 'src/modules/crash/documents/crash_game'
import { type BalanceType } from 'src/modules/user/types'
import { emitSocketEventForGame } from '../game'

interface ClosedCrashBet
  extends Pick<
    CrashBet,
    | 'closedOut'
    | 'userId'
    | 'cashoutCrashPoint'
    | 'upgradeItems'
    | 'payoutValue'
  > {
  closedOut: true
}

interface OpenCrashBet
  extends Pick<
    CrashBet,
    | 'closedOut'
    | 'balanceType'
    | 'betAmount'
    | 'incognito'
    | 'id'
    | 'user'
    | 'userId'
  > {
  closedOut: false
}

type UpdateCrashBet = ClosedCrashBet | OpenCrashBet
type UpdateCrashGame = Pick<
  CrashGame,
  'id' | 'hash' | 'bettingEndTime' | 'runningStartTime' | 'crashPoint'
> & { state: number }

const UserBalanceTypeIds: Readonly<Record<BalanceType, number>> = {
  crypto: 1,
  eth: 2,
  ltc: 3,
  cash: 4,
  usdt: 5,
  usdc: 6,
  xrp: 7,
  doge: 8,
  trx: 9,
}

const getBalanceTypeID = (balanceType: BalanceType) => {
  return UserBalanceTypeIds[balanceType]
}

export class CrashGameServer extends CrashTicker {
  emitMessage(message: ArrayBufferLike) {
    emitSocketEventForGame('crash', 'stateUpdate', message)
  }

  updateCrash(game: UpdateCrashGame) {
    const bettingEndTime = game.bettingEndTime
      ? new Date(game.bettingEndTime).getTime() - Date.now()
      : 0
    const runningStartTime = game.runningStartTime
      ? new Date(game.runningStartTime).getTime() - Date.now()
      : 0

    let messageSize = 1 + game.id.length + 1 + 4 + 4

    if (game.state === StateIds[OverState]) {
      messageSize += 1 + game.hash.length + 4
    }

    const updateCrashMessage = new WebsocketMessage(
      messageSize,
      UpdateCrashMessageId,
    )

    updateCrashMessage
      .put(game.id.length)
      .putString(game.id)
      .put(game.state)
      .putInt32(bettingEndTime)
      .putInt32(runningStartTime)

    if (game.state === StateIds[OverState]) {
      updateCrashMessage
        .put(game.hash.length)
        .putString(game.hash)
        .putInt32(game.crashPoint * 100)
    }

    this.emitMessage(updateCrashMessage.array.buffer)
  }

  updateCrashBet(crashBet: UpdateCrashBet) {
    let messageSize = 1 + 1 + crashBet.userId.length

    if (!crashBet.closedOut) {
      messageSize += 1 + 4 + 1 + 1 + crashBet.id.length

      if (!crashBet.incognito) {
        messageSize += 1 + crashBet.user.name.length
      }
    } else {
      messageSize += 4 + 4
    }

    const updateCrashMessage = new WebsocketMessage(
      messageSize,
      UpdateCrashBetMessageId,
    )

    updateCrashMessage
      .put(crashBet.closedOut ? 1 : 0)
      .put(crashBet.userId.length)
      .putString(crashBet.userId)

    if (!crashBet.closedOut) {
      updateCrashMessage
        .put(crashBet.userId.length)
        .putString(crashBet.id)
        .put(getBalanceTypeID(crashBet.balanceType))
        .putFloat(crashBet.betAmount)
        .put(crashBet.incognito ? 1 : 0)

      if (!crashBet.incognito) {
        updateCrashMessage
          .put(crashBet.user.name.length)
          .putString(crashBet.user.name)
      }
    } else {
      updateCrashMessage
        .putInt32(crashBet.cashoutCrashPoint * 100)
        .putFloat(crashBet.payoutValue)
    }

    this.emitMessage(updateCrashMessage.array.buffer)
  }

  onTick(elapsed: number) {
    const tickMessage = new WebsocketMessage(4, TickMessageId)
    tickMessage.putInt32(elapsed)

    this.emitMessage(tickMessage.array.buffer)
  }
}
