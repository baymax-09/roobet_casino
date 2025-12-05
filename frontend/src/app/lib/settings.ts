import moment from 'moment'

import { api } from 'common/util'
import { store } from 'app/util'
import { setSettings } from 'app/reducers/settings'
import { setStorageItem } from 'app/util/storage'

export interface SettingsResponse {
  serverTime: string
  sessionId?: string
  disabledApp: boolean
  globalStats: {
    globalAmountWonPast24: number
    allTimeNumBets: number
  }
  banner?: string
  bannerLink?: string
  bannerLinkTitle?: string
  countryCode: string | null
  regionCountryCode: string | null
  flags: Record<string, true>
  features: Record<string, boolean>
  restrictedRegion: boolean
  restrictedCountries: string[]
}

export const fetchSettings = async () => {
  try {
    const response = await api.get<null, SettingsResponse>('/settings/get')

    const offset = new Date(response.serverTime).getTime() - Date.now()
    moment.now = () => offset + Date.now()

    store.dispatch(setSettings(response))

    if (window.seon && response.sessionId) {
      window.seon.config({
        host: 'seondf.com',
        session_id: response.sessionId,
        audio_fingerprint: true,
        canvas_fingerprint: true,
        webgl_fingerprint: true,
        onSuccess: function (message) {
          window.seon.getBase64Session(function (data) {
            if (data) {
              window.seonSessionPayload = data
            } else {
              console.error('Failed to retrieve session data.')
            }
          })
        },
        onError: function (message) {
          console.error(message)
        },
      })
    }

    return true
  } catch (err) {
    setStorageItem('settingsErr', 'chris is right')
    window.reloadOnConnect = true
    store.dispatch(setSettings({ disabledApp: true }))
    return false
  }
}
