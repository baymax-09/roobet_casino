import { type RequestHandler } from 'express'
import jwt from 'jsonwebtoken'

import { config } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import { decodeToken } from 'src/modules/auth'

import { HacksawErrorCodes } from './errors'

export const validateRequest: RequestHandler = (req, res, next) => {
  if (req.body.secret !== config.hacksaw.secret) {
    res.status(200).json({
      statusMessage: 'Invalid auth secret',
      statusCode: HacksawErrorCodes.GeneralServerError,
    })
    return
  }

  next()
}

export function generateAuthToken(user: UserTypes.User): string {
  const token = jwt.sign(
    { id: user.id, service: 'hacksaw' },
    config.jwt.secret,
    {
      algorithm: 'HS256',
      expiresIn: '5 minutes',
    },
  )
  return token
}

/**
 * We needed custom tokens of a fixed length so the payload just decodes directly to userId
 */
export async function getUserFromAuthToken(
  token: string,
): Promise<UserTypes.User | null> {
  const { user } = await decodeToken(token, 'hacksaw')
  return user
}
