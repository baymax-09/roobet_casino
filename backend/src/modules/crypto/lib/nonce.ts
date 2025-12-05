import crypto from 'crypto'
import {
  createCryptoNonce,
  incrementCryptoNonce,
} from '../documents/crypto_nonce'
import { type CryptoNetwork } from '../types'

export function generateNonce(format: 'hex' | 'base64' = 'hex') {
  return crypto.randomBytes(16).toString(format)
}

export async function updateCryptoNonce(
  network: CryptoNetwork,
  defaultNonce: number,
) {
  const latestNonce = await incrementCryptoNonce(network)
  if (!latestNonce) {
    return await createCryptoNonce({
      crypto: network,
      nonce: defaultNonce,
    })
  }

  return latestNonce
}
