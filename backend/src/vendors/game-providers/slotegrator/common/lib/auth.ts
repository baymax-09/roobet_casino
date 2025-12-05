import crypto from 'crypto'

import { deepSort } from 'src/util/helpers/lists'

/**
 * Create query string that supports nested values, such as:
 *
 * test[value][0]=true&test[value][1]=false&other[child]=2
 */
export const toDeepQueryString = (input: object) => {
  const encodeValue = (input: unknown) => {
    if (typeof input === 'number') {
      const stringInput = input.toString()

      // Round to 4 digits, it's another weird PHP thing...
      if (stringInput.match(/^[0-9]+\.[0-9]{4,}$/)) {
        const [int, decimals] = stringInput.split('.')

        const pow = Math.pow(10, 4)
        const unrounded = parseFloat(`0.${decimals}`)
        const rounded = Math.round((unrounded + Number.EPSILON) * pow) / pow

        return `${Number(int) + rounded}`
      }
    }

    return `${input}`.replaceAll('&', '%26')
  }

  const getPairs = (
    obj: object,
    keys: string[] = [],
  ): Array<[string[], string]> => {
    return Object.entries(obj).reduce<Array<[string[], string]>>(
      (pairs, [key, value]) => {
        if (typeof value === 'object') {
          return [...pairs, ...getPairs(value, [...keys, key])]
        }

        return [...pairs, [[...keys, key], value]]
      },
      [],
    )
  }

  return getPairs(input)
    .map(
      ([[key0, ...keysRest], value]) =>
        `${key0}${keysRest.map(a => `[${a}]`).join('')}=${encodeValue(value)}`,
    )
    .join('&')
}

/**
 * This is a partial implementation of the PHP http_build_query
 * function in Javascript. PHP is opinioned about how query strings
 * and urls are encoded. Slotegrator uses PHP to sign requests,
 * and as such, we must replicate that implementation.
 *
 * @ref https://www.php.net/manual/en/function.http-build-query.php
 */
export const httpBuildQuery = (params: object) => {
  const encodeValue = (input: string | undefined) => {
    if (input === null || input === undefined) {
      return undefined
    }

    if (input === 'true') {
      return '1'
    }

    if (input === 'false') {
      return '0'
    }

    return (
      encodeURIComponent(input)
        // We have to encode &s above, and calling encodeURIComponent on
        // the already encoded string will cause a double-encode of sorts.
        .replaceAll('%2526', '%26')
        .replaceAll('%20', '+')
        .replaceAll("'", '%27')
        .replaceAll('(', '%28')
        .replaceAll(')', '%29')
    )
  }

  const parts = toDeepQueryString(params)
    .split('&')
    .map(part => {
      const [key, val] = part.split('=')

      return `${encodeValue(key)}=${encodeValue(val)}`
    })

  return parts.join('&')
}

export const calculateHMACSignature = (
  merchantKey: string,
  unsortedPayload: object,
) => {
  const sortedParams = deepSort(unsortedPayload)
  const querystring = httpBuildQuery(sortedParams)

  return crypto
    .createHmac('sha1', merchantKey)
    .update(querystring)
    .digest('hex')
}
