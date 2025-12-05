import * as t from 'io-ts'

import { decode58 } from './base58'
import { SHA256, getBase58CheckAddress } from './crypto'
import { hexStr2byteArray } from './bytes'

export const ADDRESS_PREFIX = '41'
const ADDRESS_SIZE = 34
const ADDRESS_PREFIX_BYTE = 0x41

export function decodeBase58Address(base58String: string): number[] {
  const invalidAddressMsg = 'Invalid address provided'
  if (base58String.length <= 4) {
    throw new Error(invalidAddressMsg)
  }

  let address = decode58(base58String)

  const len = address.length
  const offset = len - 4
  const checkSum = address.slice(offset)

  address = address.slice(0, offset)

  const hash0 = SHA256(address)
  const hash1 = SHA256(hash0)
  const checkSum1 = hash1.slice(0, 4)

  if (
    checkSum[0] == checkSum1[0] &&
    checkSum[1] == checkSum1[1] &&
    checkSum[2] == checkSum1[2] &&
    checkSum[3] == checkSum1[3]
  ) {
    return address
  }

  throw new Error(invalidAddressMsg)
}

const isAddressValid = (base58Str: string) => {
  if (!t.string.is(base58Str)) {
    return false
  }

  if (base58Str.length !== ADDRESS_SIZE) {
    return false
  }

  let address = decode58(base58Str)

  if (address.length !== 25) {
    return false
  }

  if (address[0] !== ADDRESS_PREFIX_BYTE) {
    return false
  }

  const checkSum = address.slice(21)
  address = address.slice(0, 21)

  const hash0 = SHA256(address)
  const hash1 = SHA256(hash0)
  const checkSum1 = hash1.slice(0, 4)

  if (
    checkSum[0] == checkSum1[0] &&
    checkSum[1] == checkSum1[1] &&
    checkSum[2] == checkSum1[2] &&
    checkSum[3] == checkSum1[3]
  ) {
    return true
  }

  return false
}

export const isAddress = (address: unknown): boolean => {
  if (!address || !t.string.is(address)) {
    return false
  }

  // Convert HEX to Base58
  if (address.length === 42) {
    try {
      // it throws an error if the address starts with 0x
      return isAddress(getBase58CheckAddress(hexStr2byteArray(address)))
    } catch (err) {
      return false
    }
  }
  try {
    return isAddressValid(address)
  } catch (err) {
    return false
  }
}
