export type CookieItemSameSites = 'Strict' | 'Lax' | 'None'

/**
 * A cookie object.
 */
export interface CookieItem {
  key: string
  value: string | object
}

/**
 * An extended cookie object with params for setting a cookie.
 */
export interface CookieItemParams extends CookieItem {
  expires?: Date
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: CookieItemSameSites
}

/**
 * Checks if a cookie item with the specified key exists.
 * @param key - The key of the cookie item to check.
 * @returns A boolean indicating whether the cookie item exists.
 */
export function hasCookieItem(key: string): boolean {
  return document.cookie
    .split(';')
    .some(item => item.trim().startsWith(`${key}=`))
}

/**
 * Gets a cookie item.
 * @param key - The key of the cookie item to get.
 * @returns A cookie object.
 */
export function getCookieItem(key: string): CookieItem | null {
  const cookie = document.cookie
    .split(';')
    .find(item => item.trim().startsWith(`${key}=`))
  if (!cookie) {
    return null
  }

  return { key, value: cookie.split('=')[1].trim() }
}

/**
 * Sets a cookie item.
 * @param cookie A cookie object.
 */
export function setCookieItem(cookie: CookieItemParams): void {
  const finalValue =
    typeof cookie.value === 'object'
      ? JSON.stringify(cookie.value)
      : cookie.value
  const attribs = serializeAttribs(cookie)
  const finalCookie = `${cookie.key}=${finalValue}${attribs}`
  document.cookie = finalCookie
}

/**
 * Removes a cookie item.
 * @param key The key of the cookie item to remove.
 */
export function removeCookieItem(key: string): void {
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

/**
 * Serializes the attributes of a cookie item (except `key` and `value`) into a string.
 * @param cookie The cookie item to serialize.
 * @returns A string representation of the cookie item's attributes.
 */
function serializeAttribs(cookie: CookieItemParams): string {
  const attribs = Object.keys(cookie).reduce((pre, cur) => {
    if (cur === 'key' || cur === 'value') {
      return pre
    }
    const isBool = typeof cookie[cur] === 'boolean'
    const isDate = cookie[cur] instanceof Date
    return `${pre}${
      isBool
        ? cookie[cur] === true
          ? `; ${cur}`
          : ''
        : `; ${cur}=${isDate ? cookie[cur].toUTCString() : cookie[cur]}`
    }`
  }, '')
  return attribs
}
