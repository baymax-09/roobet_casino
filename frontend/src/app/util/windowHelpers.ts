import { setStorageItem } from './storage'

/**
 * This is not to be used for responsive design.
 * @deprecated This should not be used for UI responsiveness, but that's the only way we currently use it.
 */
export const isMobile = function () {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    navigator.userAgent,
  )
}

export const makeAndSetClientSeed = () => {
  var result = ''
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var charactersLength = characters.length
  for (var i = 0; i < 15; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  setStorageItem('clientSeed', result)
  return result
}

export const getUrlParameter = name => {
  name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]')
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)')
  var results = regex.exec(window.location.search)
  return results === null
    ? ''
    : decodeURIComponent(results[1].replace(/\+/g, ' '))
}

export const popupwindow = (url, title, width, height) => {
  var left = window.screen.width / 2 - width / 2
  var top = window.screen.height / 2 - height / 2
  return window.open(
    url,
    title,
    'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' +
      width +
      ', height=' +
      height +
      ', top=' +
      top +
      ', left=' +
      left,
  )
}

export const getCookie = cname => {
  const name = cname + '='
  const decodedCookie = decodeURIComponent(document.cookie)
  const ca = decodedCookie.split(';')
  for (var i = 0; i < ca.length; i++) {
    let cookie = ca[i]
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1)
    }
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length)
    }
  }
  return null
}

const removeItem = (sKey, sPath, sDomain) => {
  document.cookie =
    encodeURIComponent(sKey) +
    '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
    (sDomain ? '; domain=' + sDomain : '') +
    (sPath ? '; path=' + sPath : '')
}

export const eraseCookie = name => {
  removeItem(name, '/', '.' + window.location.hostname)
  removeItem(name, '/', window.location.hostname)
}
