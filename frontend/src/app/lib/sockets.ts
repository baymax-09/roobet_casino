import io from 'socket.io-client'

import { env } from 'common/constants'
import { store, updateActiveIntercomUser } from 'app/util'
import { setSettings } from 'app/reducers/settings'
import { setUser, updateMatchPromo } from 'app/reducers/user'
import {
  incrementBalance,
  setUserBalances,
  type TransactionCreatedPayload,
} from 'app/reducers/balances'
import { setSocketUser } from 'app/reducers/sockets'
import { playSound } from 'app/lib/sound'
import { productApolloClient, NotificationsQuery } from 'app/gql'

import { getAccount } from './user'

/**
 * Force update notification query.
 *
 * Since we are not getting back a serialized GQL object
 * in socket payloads, instead of trying to serialize it ourselves
 * and append it to the cache, just ask apollo to refetch the query.
 */
const updateUserMessages = () => {
  productApolloClient.refetchQueries({
    include: [NotificationsQuery],
  })
}
export class Sockets {
  // TODO: Consider making these variables private, and altering them purely with setters and getters.
  _socket: ReturnType<typeof io>
  socketToken: string | null
  dcStartTimer: ReturnType<typeof setTimeout> | null
  dcTimer: ReturnType<typeof setTimeout> | null
  reloadOnConnect: boolean | null

  constructor() {
    this.socketToken = null
    this.dcStartTimer = null
    this.dcTimer = null
    this.reloadOnConnect = null

    this._socket = io(env.SOCKET_URL, {
      forceNew: true,
      'force new connection': true,
      transports: ['websocket'],
      reconnectionDelay: 250,
      reconnectionDelayMax: 250,
    })

    window.socketio = this._socket

    this._socket.on('connect', () => {
      this.clearTimeouts()
      store.dispatch(setSettings({ disconnected: false }))
    })

    this._socket.on('newDeposit', deposit => {
      const { type, amount, firstTimeDeposit } = deposit
      window.dataLayer.push({
        event: 'deposit',
        amount,
        type,
        ...(firstTimeDeposit && { firstTimeDeposit }),
      })
    })

    this._socket.on('newOfferDeposit', offerDeposit => {
      window.dataLayer.push({
        event: 'offer_deposit',
        amount: offerDeposit.amount,
      })
    })

    this._socket.on('settingsUpdated', settings => {
      store.dispatch(setSettings(settings))
    })

    this._socket.on('currencyUpdated', () => {
      getAccount()
    })

    this._socket.on('refreshRequired', () => {
      store.dispatch(setSettings({ update: true }))
    })

    this._socket.on('forceRefresh', () => {
      window.location.reload()
    })

    this._socket.on('securityInfoChange', payload => {
      store.dispatch(setUser({ security: payload.new_val }))
    })

    this._socket.on('matchPromo', ({ promo }) => {
      store.dispatch(updateMatchPromo(promo))
    })

    this._socket.on(
      'transactionCreated',
      (payload: TransactionCreatedPayload) => {
        const { balanceUpdateTimestamp } = payload
        const balanceUpdateDate = new Date(balanceUpdateTimestamp)
        // Calculate delay based on the timestamp of the balance update.
        const delay = Math.max(0, balanceUpdateDate.getTime() - Date.now())

        setTimeout(() => {
          store.dispatch(incrementBalance(payload))
        }, delay)
      },
    )

    this._socket.on('user_change', payload => {
      store.dispatch(setUser(payload))

      // The on transactionCreated event listener handles balance updates
      // so we have to be careful not to update it here as well.
      if ('selectedBalanceType' in payload) {
        const { selectedBalanceType } = payload
        store.dispatch(setUserBalances({ selectedBalanceType }))
      }

      if (
        payload.hiddenTotalDeposited &&
        store.getState().user.hiddenTotalDeposited !==
          payload.hiddenTotalDeposited
      ) {
        setTimeout(() => {
          updateActiveIntercomUser(store.getState().user)
        }, 1000)
      }

      // setTimeout(() => {
      //   if (!window.hasAsked) {
      //     try {
      //       OneSignal.isPushNotificationsEnabled(isEnabled => {
      //         if (!isEnabled) {
      //           OneSignal.showNativePrompt()
      //         }
      //       })
      //     } catch (err) { }
      //   }
      //   window.hasAsked = true
      // }, 1000)
    })

    this._socket.on('kyc_change', () => {
      getAccount()
    })

    this._socket.on('newNotification', payload => {
      // Send toast notification and play sound.
      window.toast?.info(payload.message)
      playSound('notification', 'newNotif')

      // Update messages store.
      updateUserMessages()
    })

    this._socket.on('newMessage', () => {
      // Update messages store.
      updateUserMessages()
    })

    this._socket.on('unsendMessage', () => {
      // Update messages store.
      updateUserMessages()
    })

    this._socket.on('disconnect', () => {
      this.clearTimeouts()

      this.dcStartTimer = setTimeout(() => {
        store.dispatch(setSettings({ disconnected: true }))
        this.dcTimer = setTimeout(() => {
          this.reloadOnConnect = true
        }, 10000)
      }, 5000)
    })

    this._socket.on('reconnect', () => {
      store.dispatch(setSettings({ disconnected: false }))
      if (this.reloadOnConnect || window.reloadOnConnect) {
        return window.location.reload()
      }

      const { user } = store.getState()

      if (user) {
        store.dispatch(setSocketUser(user.id))
      }

      this.clearTimeouts()
    })
  }

  private clearTimeouts() {
    if (this.dcTimer) {
      clearTimeout(this.dcTimer)
    }

    if (this.dcStartTimer) {
      clearTimeout(this.dcStartTimer)
    }
  }

  setToken(token: string) {
    this.socketToken = token
  }
}

export const defaultSocket = new Sockets()
