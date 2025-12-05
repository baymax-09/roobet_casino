import EventEmitter from 'eventemitter3'
import io from 'socket.io-client'

import { WebsocketMessage } from 'app/lib/WebsocketMessage'
import { env } from 'common/constants'

import { IDToBalanceType } from './constants'

const NotStartedState = 'NotStarted'
const TakingBetsState = 'TakingBets'
const RunningState = 'Running'
const OverState = 'Over'

const StateIdToName = {
  1: NotStartedState,
  2: TakingBetsState,
  3: RunningState,
  4: OverState,
}

export class CrashSocket extends EventEmitter {
  socket: io | undefined

  disconnect() {
    if (this.socket) {
      this.socket.close()
    }
  }

  connect() {
    // Construct socket.io connection.
    this.socket = io(`${env.SOCKET_URL}/crash`, {
      forceNew: true,
      'force new connection': true,
      transports: ['websocket'],
    })

    // Emit ready event on connection.
    this.socket.on('connect', () => {
      this.emit('ready')
    })

    // Emit reconnecting event on reconnect.
    this.socket.on('reconnect', () => {
      this.emit('reconnect')
    })

    this.socket.on('disconnect', () => {
      this.emit('disconnect')
    })

    this.socket.on('stateUpdate', data => {
      try {
        const message = new WebsocketMessage(data)
        const messageId = message.read()

        // Crash game updated.
        if (messageId === 3) {
          const id = message.readString(message.read())
          const state = message.read()
          const bettingEndTime = message.readInt32()
          const runningStartTime = message.readInt32()

          const normalized: Record<string, any> = {
            id,
            state: StateIdToName[state],
            countdown: {
              bettingEndTime,
              runningStartTime,
            },
          }

          if (state === 4) {
            normalized.hash = message.readString(message.read())
            normalized.crashPoint = message.readInt32() / 100
          }

          this.emit('crashGameUpdate', normalized)
        }

        // Crash tick.
        if (messageId === 4) {
          const elapsed = message.readInt32()
          this.emit('tick', [elapsed])
        }

        // Crash bet closed.
        if (messageId === 5) {
          const closedOut = message.read() === 1
          const userId = message.readString(message.read())

          const normalized: Record<string, any> = {
            userId,
            closedOut,
          }

          if (closedOut) {
            normalized.cashoutCrashPoint = message.readInt32() / 100
            normalized.payoutValue = message.readFloat()
          } else {
            normalized.id = message.readString(message.read())
            const balanceTypeId = message.read()
            normalized.balanceType = IDToBalanceType[balanceTypeId]
            normalized.betAmount = message.readFloat()
            normalized.incognito = message.read() === 1

            if (!normalized.incognito) {
              normalized.user = {
                name: message.readString(message.read()),
              }
            }
          }

          if (!normalized.incognito && !normalized.user) {
            normalized.incognito = true
          }

          this.emit('crashBet', normalized)
        }
      } catch (error) {
        console.error('CrashSocket message:', error)
      }
    })
  }
}
