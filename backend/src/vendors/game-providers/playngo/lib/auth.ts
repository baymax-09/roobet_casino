import jwt from 'jsonwebtoken'

import { config } from 'src/system'
import { type Types as UserTypes, getUserById } from 'src/modules/user'
import { decodeToken } from 'src/modules/auth'

export function generateAuthToken(
  user: UserTypes.User,
  expires = false,
): string {
  const token = jwt.sign(
    { id: user.id, service: 'playngo' },
    config.jwt.secret,
    {
      algorithm: 'HS256',
      ...(expires ? { expiresIn: '5 minutes' } : {}),
    },
  )
  return token
}

export async function getUserFromAuthToken(
  token: string,
): Promise<UserTypes.User | null> {
  const { user } = await decodeToken(token, 'playngo')
  return user
}

export async function getUserFromExternalId(
  externalId: string,
): Promise<UserTypes.User | null> {
  const user = await getUserById(externalId)
  return user
}

export function validateAccessToken(token: string): boolean {
  return token === config.playngo.accessToken
}
