import * as t from 'io-ts'

import { isHexChar } from './hex'

type BytesLike = string | Uint8Array

export const getBytes = (value: BytesLike): Uint8Array => {
  if (value instanceof Uint8Array) {
    return value
  }

  if (typeof value === 'string' && value.match(/^0x([0-9a-f][0-9a-f])*$/i)) {
    const result = new Uint8Array((value.length - 2) / 2)
    let offset = 2
    for (let i = 0; i < result.length; i++) {
      result[i] = parseInt(value.substring(offset, offset + 2), 16)
      offset += 2
    }
    return result
  }

  throw new Error('invalid BytesLike value')
}

export const byte2hexStr = (byte: number): string => {
  if (byte < 0 || byte > 255) {
    throw new Error('Input must be a byte')
  }

  const hexByteMap = '0123456789ABCDEF'

  let str = ''
  str += hexByteMap.charAt(byte >> 4)
  str += hexByteMap.charAt(byte & 0x0f)

  return str
}

export const byteArray2hexStr = (byteArray: number[] | Uint8Array) => {
  let str = ''

  for (let i = 0; i < byteArray.length; i++) {
    str += byte2hexStr(byteArray[i])
  }

  return str
}

const hexChar2byte = (char: string) => {
  let d: number | undefined

  if (char >= 'A' && char <= 'F') {
    d = char.charCodeAt(0) - 'A'.charCodeAt(0) + 10
  } else if (char >= 'a' && char <= 'f') {
    d = char.charCodeAt(0) - 'a'.charCodeAt(0) + 10
  } else if (char >= '0' && char <= '9') {
    d = char.charCodeAt(0) - '0'.charCodeAt(0)
  }

  if (t.number.is(d)) {
    return d
  } else {
    throw new Error('The passed hex char is not a valid hex char')
  }
}

// set strict as true: if the length of str is odd, add 0 before the str to make its length as even
export const hexStr2byteArray = (str: string, strict = false) => {
  let len = str.length

  if (strict) {
    if (len % 2) {
      str = `0${str}`
      len++
    }
  }
  const byteArray: number[] = []
  let d = 0
  let j = 0
  let k = 0

  for (let i = 0; i < len; i++) {
    const char = str.charAt(i)

    if (isHexChar(char)) {
      d <<= 4
      d += hexChar2byte(char)
      j++

      if (j % 2 === 0) {
        byteArray[k++] = d
        d = 0
      }
    } else {
      throw new Error('The passed hex char is not a valid hex string')
    }
  }

  return byteArray
}
