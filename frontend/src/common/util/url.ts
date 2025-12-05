import { setStorageItem } from 'app/util'
import { env } from 'common/constants'

export const isUrlExternal = urlOrPath => {
  try {
    const current = window.location
    const url = new URL(urlOrPath)

    return current.origin !== url.origin
  } catch {}

  return false
}

export const urlSearchParamsToMap = (
  urlSearchParams: URLSearchParams,
): Record<string, string> => Object.fromEntries(urlSearchParams.entries())

export const postAuthRedirectQueryHandler = (location: Location): void => {
  // Establish if redirectURL is present in the format expected
  const urlSearchParams = new URLSearchParams(location.search)
  const possibleRedirect = urlSearchParams.get('redirect_url')
  const hasRedirect = possibleRedirect && possibleRedirect.length > 0
  if (!hasRedirect) {
    return
  }

  // Establish if the redirectURL has the expected hostname
  const redirectURL = new URL(possibleRedirect)
  const hostNameUnity = redirectURL.hostname === location.hostname
  const newExternalRoutePattern = new RegExp(env.API_URL)
  const oldExternalRoutePattern = new RegExp(env.API_URL_OLD)
  const hostNameExternal =
    newExternalRoutePattern.test(redirectURL.href) ||
    oldExternalRoutePattern.test(redirectURL.href)

  if (!hostNameUnity && !hostNameExternal) {
    return
  }

  const redirectInfo = JSON.stringify({
    redirectURL: redirectURL.href,
  })
  setStorageItem('redirectInfo', redirectInfo)
}
