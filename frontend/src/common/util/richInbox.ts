import { env } from 'common/constants'
import { type ConfigResponse, type LoginResponse } from 'common/types'

import { logEvent } from './logger'
import { initiateFasttrackPusher } from './pusher'

const CONFIG_URL = env.FASTTRACK_CONFIG_URL

// Get the base url for the endpoints:
const getBaseEndpoints = async (): Promise<ConfigResponse | undefined> => {
  try {
    const response = await fetch(CONFIG_URL, {
      method: 'GET',
      credentials: 'omit',
    })
    return await response.json()
  } catch (error) {
    logEvent('Error when logging in user for rich inbox', { error }, 'warn')
    return undefined
  }
}

// Do the login to Fasttrack integration:
const login = async (fusionUrl): Promise<LoginResponse | undefined> => {
  // The window.sid should be set when the user data is fetched from /account/get
  const sid = window.sid
  if (!sid) {
    logEvent(
      'No sid found when attempting to login user for Rich Inbox',
      {},
      'warn',
    )
  }

  try {
    const response = await fetch(`${fusionUrl}/Platform/LoginAuthToken`, {
      method: 'POST',
      credentials: 'omit',
      headers: { authtoken: sid },
    })
    return await response.json()
  } catch (error) {
    logEvent(
      'Error when logging in user for rich inbox',
      { sid, error },
      'warn',
    )
    return undefined
  }
}

export const initiateRichInbox = async () => {
  window.fasttrackbrand = 'roobet'
  window.fasttrackbrandId = 181

  // Get config
  const configResponse = await getBaseEndpoints()

  if (!configResponse) {
    return
  }

  // Do the login against Fasttrack integration
  const loginResponse = await login(configResponse.fusionUrl)

  if (!loginResponse) {
    return
  }

  // Check if any errors occurred
  if (!loginResponse.Success && loginResponse.Errors.length > 0) {
    logEvent(
      'Error when logging in user for rich inbox',
      { errors: loginResponse.Errors },
      'warn',
    )
    return
  }

  const userId = loginResponse.Data.User.UserId

  // Check if successful and got needed values
  if (!loginResponse.Success || !loginResponse.Data || !userId) {
    logEvent(
      'Unable to get appropriate data from user login for rich inbox',
      {},
      'warn',
    )
    return
  }

  // Initiate pusher for real-time notifications
  const authEndpoint = `${configResponse.fusionUrl}/external/pusher/${window.fasttrackbrand}?authToken=${loginResponse.Data.Authentication.AuthToken}`
  initiateFasttrackPusher(configResponse.pusherKey, authEndpoint)

  return {
    fusionUrl: configResponse.fusionUrl,
    richInboxAuthToken: loginResponse.Data.Authentication.AuthToken,
    fastTrackUserId: loginResponse.Data.User.UserId,
  }
}
