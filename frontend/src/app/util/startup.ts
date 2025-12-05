import 'src/styles/toast.scss'
import 'src/styles/excon.css'

import OneSignal from 'react-onesignal'
import { datadogRum } from '@datadog/browser-rum'
import { datadogLogs } from '@datadog/browser-logs'

import { env } from 'common/constants'
import { getCookie, makeAndSetClientSeed } from 'app/util'
import { getAccount } from 'app/lib/user'
import { setSettings } from 'app/reducers/settings'
import { events } from 'common/core'

import { store } from './store'
import { hasStorageItem } from './storage'
import { loadCellxpert } from './'
import VersionJSON from '../../version.json'

// Ex: DATADOG_TRACING_SAMPLE_RATE=1, we will only send 1 percent of the time
const tracingSampleRate = (() => {
  const samplingRate = Number(env.DATADOG_TRACING_SAMPLE_RATE)
  if (isNaN(samplingRate)) {
    return 0.01
  }
  return (100 - (100 - Number(env.DATADOG_TRACING_SAMPLE_RATE))) / 100
})()

export const loadTracking = () => {
  const search = new URLSearchParams(window.location.search)

  const ref = search.get('ref')

  const { cxd, cxAffId } = loadCellxpert(
    search.get('cxd'),
    search.get('affid'),
    ref,
  )

  window.tracking = {
    ref: ref ?? undefined,
    transactionId: search.get('transactionId') || undefined,
    transactionSource: search.get('transactionSource') || undefined,
    subId: search.get('subId') || undefined,
    utm_source: search.get('utm_source') || undefined,
    utm_medium: search.get('utm_medium') || undefined,
    utm_campaign: search.get('utm_campaign') || undefined,
    cxd,
    cxAffId,
  }
}

if (window.history.replaceState) {
  window.history.replaceState(null, '', window.location.href)
}

export const loadUser = async () => {
  try {
    const user = await getAccount()
    if (user) {
      datadogLogs.setGlobalContext({
        id: user.id,
        username: user.name,
      })
      datadogRum.setUser({
        id: user.id,
        name: user.name,
        email: user.email,
      })
    }
  } catch (err) {
    console.error('loadUser', err)
  }

  store.dispatch(
    setSettings({
      loadedUser: true,
    }),
  )

  try {
    if (window?.opener?.origin === env.BASE_URL) {
      window.opener.postMessage(
        {
          event: 'rbInit',
          payload: {
            token: getCookie('token'),
            twoFactorRequired: getCookie('twofactorRequired') === 'true',
          },
        },
        window.opener.origin,
      )
      return
    }
  } catch (err) {
    console.error(err)
  }

  if (!hasStorageItem('clientSeed')) {
    makeAndSetClientSeed()
  }

  events.emit('loaderpreconditions', ['account', 'settings'])
}

export const startup = () => {
  datadogRum.init({
    applicationId: env.DATADOG_APP_ID,
    clientToken: env.DATADOG_CLIENT_TOKEN,
    site: env.DATADOG_SITE,
    version: VersionJSON.version,
    service: env.DATADOG_SERVICE,
    env: env.DATADOG_ENV,
    sessionSampleRate: Number(env.DATADOG_SAMPLE_RATE),
    sessionReplaySampleRate: Number(env.DATADOG_SESSION_SAMPLE_RATE),
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
    allowedTracingUrls: [env.API_URL],
    traceSampleRate: Number(env.DATADOG_SAMPLE_RATE),
    trackViewsManually: true,
    beforeSend: event => {
      // Returning "false" will discard and event: https://docs.datadoghq.com/real_user_monitoring/guide/enrich-and-control-rum-data/?tab=event#discard-a-frontend-error
      // Don't send non-error XHR resources (correspond to traces) depending on tracing sample rate
      if (
        event.type === 'resource' &&
        event.resource.type === 'xhr' &&
        event.resource.status_code &&
        event.resource.status_code < 400
      ) {
        return !(Math.random() >= tracingSampleRate)
      }

      return true
    },
  })

  datadogRum.startSessionReplayRecording()

  datadogLogs.init({
    clientToken: env.DATADOG_CLIENT_TOKEN,
    site: env.DATADOG_SITE,
    service: env.DATADOG_SERVICE,
    sessionSampleRate: Number(env.DATADOG_SAMPLE_RATE),
    version: VersionJSON.version,
  })

  OneSignal.init({
    appId: env.ONESIGNAL_APP_ID,
    allowLocalhostAsSecureOrigin: true,
    notifyButton: {
      enable: false,
      autoResubscribe: true,
    },
    welcomeNotification: {
      disable: true,
    },
  })

  // Hide console messages in dev & staging.
  if (env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.log(
      '%cStop!',
      'color:red;font-family:system-ui;font-size:4rem;-webkit-text-stroke: 1px black;font-weight:bold',
    )
    // eslint-disable-next-line no-console
    console.log(
      "%cThis is a browser feature intended for developers. If someone told you to copy and paste something here to enable a Roobet feature or 'hack' someone's account, it is a scam and will give them access to your Roobet account.",
      'font-family:system-ui;font-size:2rem;font-weight:bold',
    )
  }
}
