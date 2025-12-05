import * as t from 'io-ts'
import BigNumber from 'bignumber.js'

import { byteArray2hexStr, getBytes, hexStr2byteArray } from './bytes'
import { getBase58CheckAddress } from './crypto'
import { ADDRESS_PREFIX, decodeBase58Address } from './address'

const HexCharacters: string = '0123456789abcdef'

export const hexlify = (data: string | Uint8Array): string => {
  const bytes = getBytes(data)

  let result = '0x'
  for (let i = 0; i < bytes.length; i++) {
    const v = bytes[i]
    result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f]
  }
  return result
}

export const isHex = (value: string): boolean => {
  return (
    typeof value === 'string' &&
    !isNaN(parseInt(value, 16)) &&
    /^(0x|)[a-fA-F0-9]+$/.test(value)
  )
}

export const isHexChar = (char: string) => {
  if (
    (char >= 'A' && char <= 'F') ||
    (char >= 'a' && char <= 'f') ||
    (char >= '0' && char <= '9')
  ) {
    return 1
  }

  return 0
}

const fromDecimalToHex = (value: number | BigNumber): string => {
  const number = new BigNumber(value)
  const result = number.toString(16)

  return number.isLessThan(0) ? '-0x' + result.substr(1) : '0x' + result
}

const fromUtf8ToHex = (string: string) => {
  if (!t.string.is(string)) {
    throw new Error('The passed value is not a valid utf-8 string')
  }

  return '0x' + Buffer.from(string, 'utf8').toString('hex')
}

export const toHex = (val: unknown | unknown[]): string => {
  if (t.boolean.is(val)) {
    return fromDecimalToHex(Number(val))
  }

  if (BigNumber.isBigNumber(val)) {
    return fromDecimalToHex(val)
  }

  if (t.object.is(val)) {
    return fromUtf8ToHex(JSON.stringify(val))
  }

  if (t.string.is(val)) {
    if (isHex(val)) {
      return val.toLowerCase().replace(/^0x/, ADDRESS_PREFIX)
    } else {
      return byteArray2hexStr(decodeBase58Address(val)).toLowerCase()
    }
  }

  if (t.number.is(val)) {
    const result = fromDecimalToHex(val)
    if (result === '0xNaN') {
      throw new Error('The passed value is not convertible to a hex string')
    } else {
      return result
    }
  }

  throw new Error('The passed value is not convertible to a hex string')
}

/**
 *
 * @param address - must be hex string
 * @returns input when base58 string is input OR if input is not hex string
 * new base58 string when tron hex address is input
 * new base58 string when ethereum hex address is input
 */
export const fromHex = (address: string): string => {
  if (!isHex(address)) {
    return address
  }

  return getBase58CheckAddress(
    hexStr2byteArray(address.replace(/^0x/, ADDRESS_PREFIX)),
  )
}
