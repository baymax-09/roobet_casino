import FingerprintJS from '@fingerprintjs/fingerprintjs-pro'
import moment from 'moment'
import { type AxiosRequestConfig } from 'axios'

import { env } from 'common/constants'
import { api, isApiError } from 'common/util'
import { store, setStorageItem, updateActiveIntercomUser } from 'app/util'
import { fetchSettings } from 'app/lib/settings'
import { CreatePlayerTagMutation, productApolloClient } from 'app/gql'
import { defaultSocket } from 'app/lib/sockets'
import { setSocketUser } from 'app/reducers/sockets'
import { setUser } from 'app/reducers/user'
import { setBalances } from 'app/reducers/balances'
import { type BalanceType, type RedeemResponse, type User } from 'common/types'
import { setSettings } from 'app/reducers/settings'

interface PlayerTagVariables {
  tagId: string
}

export const createPlayerTag = async (tagId: string) => {
  try {
    await productApolloClient.mutate<PlayerTagVariables>({
      mutation: CreatePlayerTagMutation,
      variables: {
        data: {
          tagId,
        },
      },
    })
  } catch (error) {
    console.error('Error creating player tag:', error)
  }
}

interface EmberLinkRequest {
  emberId: string
}
interface EmberLinkResponse {
  success: boolean
  detail: string
}

export const linkEmberAccount = async (emberId: string) => {
  return await api.post<EmberLinkRequest, EmberLinkResponse>(
    '/ember/linkAccount',
    {
      emberId,
    },
  )
}

// TODO: This result type is not comprehensive, add missing properties.
const fetchUser = async (): Promise<{ result: User | undefined }> => {
  try {
    const config: AxiosRequestConfig = {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-store',
        Expires: '0',
      },
    }

    return await api.get<never, { result: User }>('/account/get', config)
  } catch {
    return { result: undefined }
  }
}

// TODO: Remove once all sessions are from API proxy.
const clearUnwantedCookies = (): void => {
  const config: AxiosRequestConfig = {
    headers: {
      'X-Roobet-Host': new URL(env.API_URL_OLD).hostname,
    },
  }

  // Send request to subdomain (old api url).
  api
    .post(`${env.API_URL_OLD}/account/sessions/sanitize`, undefined, config)
    .catch(error => {
      console.error('Failed to invalidate unwanted cookies', error)
    })
}

export const getAccount = async (): Promise<User | undefined> => {
  try {
    const [{ result: user }] = await Promise.all([fetchUser(), fetchSettings()])

    if (user) {
      defaultSocket.setToken(user.socketToken)
      store.dispatch(setBalances(user?.balances ?? {}))
      store.dispatch(setUser(user))
      store.dispatch(setSettings({ loaded: true }))
      postLoginHooks(user)
      clearUnwantedCookies()
      window.sid = user?.fasttrackToken

      if (env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('set user', user)
      }
    }

    // Inform settings state the user has loaded, regardless of auth status.
    store.dispatch(setSettings({ loaded: true }))

    return user
  } catch (err) {
    return undefined
  }
}

export const postLoginHooks = user => {
  store.dispatch(setSocketUser(user.id))
  setStorageItem('isUser', 'true')

  window.dataLayer.push({
    user_id: user.id,
  })

  tracking(user)
  // TODO: need to refactor this garbage.
  if (
    user.lastDeposit &&
    env.NODE_ENV === 'production' &&
    (user.lastDeposit > user.lastFingerprint ||
      (user.lastDeposit && !user.lastFingerprint))
  ) {
    FingerprintJS.load({ token: '1Mf24YShiOUdddymUrx5' })
      .then(fp => fp.get({ linkedId: user.id }))
      .catch(err => console.error(err))
  }
  updateActiveIntercomUser(user)
}

export const tracking = user => {
  const fields = window.tracking

  const { cxd, cxAffId, ref: affiliateName } = fields

  const shouldPostToCrm =
    ((cxd && cxAffId) || (affiliateName && !user.affiliateId)) &&
    !(moment().diff(user.createdAt, 'minutes') > 60)

  if (shouldPostToCrm) {
    api
      .post('/crm/ref', {
        affiliateName,
        cxAffId,
        cxd,
      })
      .catch(error => {
        console.error(error)
      })
  }

  // If a user doesn't have postback set, and they're not older than 60 minutes..
  // subId optional
  if (
    !user.postback &&
    !(moment().diff(user.createdAt, 'minutes') > 60) &&
    !!(fields.transactionId && fields.transactionSource)
  ) {
    api
      .post('/account/setPostback', {
        transactionId: fields.transactionId,
        transactionSource: fields.transactionSource,
        subId: fields.subId,
      })
      .then(() => {
        window.dataLayer.push({
          cpa_network: fields.transactionSource,
          cpa_subId: fields.subId,
        })
      })
      .catch(error => {
        console.error(error)
      })
  }

  const { utm_source, utm_medium, utm_campaign } = fields
  if (utm_source || utm_medium || utm_campaign) {
    api
      .post('/crm/setUTMVariables', {
        utm_source,
        utm_medium,
        utm_campaign,
      })
      .catch(error => {
        console.error(error)
      })
  }
}

export const setLocale = async locale => {
  try {
    return await api.post('/account/setLocale', {
      locale,
    })
  } catch (err) {
    if (isApiError(err)) {
      window.toast?.error(err.response.data)
    }
  }
}

export const setBalanceType = async (balanceField: BalanceType) => {
  const { balances } = store.getState()
  const selectedBalanceType = balances?.selectedBalanceType
  try {
    if (balances) {
      store.dispatch(
        setBalances({ ...balances, selectedBalanceType: balanceField }),
      )
    }
    const res = await api.post('/account/setBalanceField', {
      balanceField,
    })
    return res
  } catch (err) {
    if (selectedBalanceType) {
      store.dispatch(setBalances({ ...balances, selectedBalanceType }))
    }
    const errorMessage = isApiError(err)
      ? err.response.data
      : 'An unknown error has occurred.'
    window.toast?.error(errorMessage)
  }
}

export const chatMute = async userId => {
  const defaultMuteDurationMinutes = '5'
  const minutes = prompt(
    '# of minutes to mute for:',
    defaultMuteDurationMinutes,
  )
  const seconds = parseInt(minutes ?? defaultMuteDurationMinutes) * 60
  const reason = prompt("What's the reason?", '')
  try {
    return await api.post('/chat/mute', {
      userId,
      seconds,
      reason,
    })
  } catch (err) {
    if (isApiError(err)) {
      window.toast?.error(err.response.data)
    }
  }
}

export const chatBan = async userId => {
  const reason = prompt("What's the reason?", '')
  try {
    return await api.post('/chat/ban', {
      userId,
      reason,
    })
  } catch (err) {
    if (isApiError(err)) {
      window.toast?.error(err.response.data)
    }
  }
}

export const notificationsRead = async () => {
  try {
    return await api.get('/account/notifications/read')
  } catch (err) {
    if (isApiError(err)) {
      window.toast?.error(err.response.data)
    }
  }
}

export const endSession = (global = false, redirectToLogin = false) => {
  const basePath = global ? '/auth/logoutEverywhere' : '/auth/logout'
  const path = redirectToLogin ? `${basePath}/?redirectToLogin=true` : basePath
  window.location.href = env.API_URL + path
  window.sid = ''
}

/** @todo don't throw, return a success value */
export const changeSetting = async (systemName, settingName, value) => {
  try {
    return await api.post('/system/changeSystemSettingAsUser', {
      systemName,
      settingName,
      value,
    })
  } catch (err) {
    if (isApiError(err)) {
      throw err.response.data
    }
    throw err
  }
}

export const sendTip = async (
  username,
  amount,
  isPrivate,
  twoFactorToken = null,
) => {
  try {
    const data = {
      username,
      amount,
      isPrivate,
      ...(twoFactorToken ? { twoFactorToken } : {}),
    }

    const headers = {
      'X-Seon-Session-Payload': window.seonSessionPayload || '',
    }
    const response = await api.post('/account/transfer', data, { headers })

    window.dataLayer.push({ event: 'tip_sent' })
    return response
  } catch (err) {
    if (isApiError(err)) {
      throw err.response.data
    }
    throw 'Check Logs'
  }
}

export const userMute = async (userId, muted) => {
  try {
    const response = await api.post('/user/mutes/set', {
      userId,
      muted,
    })
    await updateMutes()
    return response
  } catch (err) {
    if (isApiError(err)) {
      window.toast?.error(err.response.data)
    }
  }
}

export const updateMutes = async () => {
  try {
    const response = await api.get('/user/mutes/get')
    store.dispatch(setUser({ mutes: response }))
  } catch (err) {
    if (isApiError(err)) {
      throw err.response.data
    }
    throw 'Check Logs'
  }
}

export const redeemCode = async (code, recaptcha): Promise<RedeemResponse> => {
  // force lowercase, just like on server.
  code = code.toLowerCase()
  try {
    const response = await api.post<
      { code: string; recaptcha: unknown },
      RedeemResponse
    >('/promo/redeemCode', {
      code,
      recaptcha,
    })
    window.dataLayer.push({ event: 'promo_claim' })
    return response
  } catch (err) {
    if (isApiError(err)) {
      throw err.response.data
    }
    throw 'Check Logs'
  }
}
