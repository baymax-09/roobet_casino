import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

import { config } from 'src/system'
import { decodeToken, UserPasswordModel } from 'src/modules/auth'

interface TippingTokenResponse {
  success: boolean
  token?: string
  error?: string
}

export async function verifyTippingToken(
  userId: string | undefined,
  authHeader: string | undefined,
): Promise<TippingTokenResponse> {
  if (
    !authHeader ||
    !authHeader.includes('Bearer ') ||
    authHeader.split(' ').length !== 2
  ) {
    return {
      success: false,
      error: 'Missing Bearer token in Authorization header',
    }
  }
  if (!userId) {
    return { success: false, error: 'Missing userId' }
  }

  let nonce = null
  try {
    // First acquire the tipping nonce for the user
    nonce = await getTippingNonce(userId)
  } catch (err) {
    return { success: false, error: 'Invalid userId' }
  }
  if (!nonce) {
    return { success: false, error: 'Missing Nonce' }
  }

  // Now verify the jwt with the nonce
  try {
    const user = await decodeToken(authHeader.split(' ')[1], 'tipping')
    if (!user || user.decoded.nonce !== nonce) {
      return { success: false, error: 'Invalid userId' }
    }
  } catch (err) {
    return { success: false, error: 'Invalid Bearer token' }
  }
  return { success: true }
}

export async function createTippingNonceFromRequest(
  userId: string | undefined,
): Promise<TippingTokenResponse> {
  if (!userId) {
    return { success: false, error: 'Missing userId' }
  }

  let nonce = null
  try {
    // First generate a nonce for the user
    nonce = await generateTippingNonce(userId)
  } catch (err) {
    return { success: false, error: 'Invalid userId' }
  }
  if (!nonce) {
    return { success: false, error: 'Missing Nonce' }
  }

  // Sign the JWT with the nonce
  const token = jwt.sign(
    { id: userId, nonce, service: 'tipping' },
    config.jwt.secret,
    {
      algorithm: 'HS256',
    },
  )
  return { success: true, token }
}

export async function generateTippingNonce(
  userId: string,
): Promise<string | null> {
  const tippingNonce = uuidv4()
  const user = await UserPasswordModel.get(userId).run()
  if (!user) {
    return null
  }
  await UserPasswordModel.get(userId).update({ tippingNonce }).run()

  return tippingNonce
}

export async function getTippingNonce(
  userId: string,
): Promise<string | null | undefined> {
  const user = await UserPasswordModel.get(userId).run()
  if (!user) {
    return null
  }
  return user.tippingNonce
}
