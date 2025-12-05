import { createHash } from 'crypto'

import { hexlify } from './hex'
import { byteArray2hexStr, getBytes, hexStr2byteArray } from './bytes'
import { encode58 } from './base58'

type BytesLike = string | Uint8Array

const _sha256 = (data: Uint8Array): Uint8Array => {
  return createHash('sha256').update(data).digest()
}

const sha256 = (data: BytesLike): string => {
  const bytes = getBytes(data)
  return hexlify(_sha256(bytes))
}

export const SHA256 = (msgBytes: number[] | Uint8Array) => {
  const msgHex = byteArray2hexStr(msgBytes)
  const hashHex = sha256('0x' + msgHex).replace(/^0x/, '')
  return hexStr2byteArray(hashHex)
}

export const getBase58CheckAddress = (addressBytes: number[]) => {
  const hash0 = SHA256(addressBytes)
  const hash1 = SHA256(hash0)

  let checkSum = hash1.slice(0, 4)
  checkSum = addressBytes.concat(checkSum)

  return encode58(checkSum)
}
