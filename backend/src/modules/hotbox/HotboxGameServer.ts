import 'core-js/stable'
import 'regenerator-runtime/runtime'

import 'src/system/config'
import { WebsocketMessage } from 'src/util/io/WebsocketMessage'

import {
  StateIds,
  OverState,
  TickMessageId,
  UpdateHotboxMessageId,
  UpdateHotboxBetMessageId,
} from './constants'
import { HotboxTicker } from './HotboxTicker'

import { type HotboxBet } from './lib/helpers/hotbox_bet'
import { type HotboxGame } from './documents/hotbox_game'
import { type BalanceType } from 'src/modules/user/types'
import { emitSocketEventForGame } from '../game'

interface ClosedHotboxBet
  extends Pick<
    HotboxBet,
    | 'closedOut'
    | 'userId'
    | 'cashoutCrashPoint'
    | 'upgradeItems'
    | 'payoutValue'
  > {
  closedOut: true
}

interface OpenHotboxBet
  extends Pick<
    HotboxBet,
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

type UpdateHotboxBet = ClosedHotboxBet | OpenHotboxBet
type UpdateHotboxGame = Pick<
  HotboxGame,
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

export class HotboxGameServer extends HotboxTicker {
  emitMessage(message: ArrayBufferLike) {
    emitSocketEventForGame('hotbox', 'stateUpdate', message)
  }

  updateHotbox(game: UpdateHotboxGame) {
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

    const updateHotboxMessage = new WebsocketMessage(
      messageSize,
      UpdateHotboxMessageId,
    )

    updateHotboxMessage
      .put(game.id.length)
      .putString(game.id)
      .put(game.state)
      .putInt32(bettingEndTime)
      .putInt32(runningStartTime)

    if (game.state === StateIds[OverState]) {
      updateHotboxMessage
        .put(game.hash.length)
        .putString(game.hash)
        .putInt32(game.crashPoint * 100)
    }

    this.emitMessage(updateHotboxMessage.array.buffer)
  }

  updateHotboxBet(hotboxBet: UpdateHotboxBet) {
    let messageSize = 1 + 1 + hotboxBet.userId.length

    if (!hotboxBet.closedOut) {
      messageSize += 1 + 4 + 1 + 1 + hotboxBet.id.length

      if (!hotboxBet.incognito) {
        messageSize += 1 + hotboxBet.user.name.length
      }
    } else {
      messageSize += 4 + 4
    }

    const updateHotboxMessage = new WebsocketMessage(
      messageSize,
      UpdateHotboxBetMessageId,
    )

    updateHotboxMessage
      .put(hotboxBet.closedOut ? 1 : 0)
      .put(hotboxBet.userId.length)
      .putString(hotboxBet.userId)

    if (!hotboxBet.closedOut) {
      updateHotboxMessage
        .put(hotboxBet.userId.length)
        .putString(hotboxBet.id)
        .put(getBalanceTypeID(hotboxBet.balanceType))
        .putFloat(hotboxBet.betAmount)
        .put(hotboxBet.incognito ? 1 : 0)

      if (!hotboxBet.incognito) {
        updateHotboxMessage
          .put(hotboxBet.user.name.length)
          .putString(hotboxBet.user.name)
      }
    } else {
      updateHotboxMessage
        .putInt32(hotboxBet.cashoutCrashPoint * 100)
        .putFloat(hotboxBet.payoutValue)
    }

    this.emitMessage(updateHotboxMessage.array.buffer)
  }

  onTick(elapsed: number) {
    const tickMessage = new WebsocketMessage(4, TickMessageId)
    tickMessage.putInt32(elapsed)

    this.emitMessage(tickMessage.array.buffer)
  }
}
