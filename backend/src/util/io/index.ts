import jwt, { type VerifyCallback } from 'jsonwebtoken'
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible'

import { io, config } from 'src/system'
import { cacheClient } from 'src/system/redis'
import { APIValidationError } from '../errors'
// takes user, key.
import { translateForUserId } from '../i18n'
import { getIpFromRequest } from 'src/modules/fraud/geofencing'
import { scopedLogger } from 'src/system/logger'

const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of points
  duration: 10, // Per second(s)
})

const ipRateLimiter = new RateLimiterRedis({
  storeClient: cacheClient(),
  points: 100, // Max message per duration
  duration: 10, // Per second(s)
  keyPrefix: 'ioroute-ip', // must be unique for limiters with different purpose
})

const userRateLimiter = new RateLimiterRedis({
  storeClient: cacheClient(),
  points: 100,
  duration: 10,
  keyPrefix: 'ioroute-userId',
})

const ioLogger = scopedLogger('util/io')('ioRoute', { userId: null })

export const ioRoute = async (
  socketName: string,
  routeFunction: (data: any, userId: string) => any,
) => {
  io.on('connection', function (socket) {
    socket.on(
      socketName,
      async function (
        data: any,
        cb?: (error: unknown, response?: unknown) => void,
      ) {
        ioLogger.info(`ioroute: new request ${socketName}`, {
          socketName,
          data,
          handshake: socket.handshake,
        })
        try {
          const clientIP = await getIpFromRequest(socket.handshake, 'local')

          if (clientIP === 'local') {
            ioLogger.info(`ioroute: no known ip ${socketName}`, {
              socketName,
              data,
              handshake: socket.handshake,
            })
          }

          await ipRateLimiter.consume(clientIP)
          await rateLimiter.consume(`${clientIP}-ioroute`)

          if (!data.socketToken) {
            ioLogger.info('ioroute: No socketToken included', {
              socketName,
              data,
              handshake: socket.handshake,
            })
            return
          }

          const verifyCallback: VerifyCallback<{ id: string }> =
            async function (error, decoded) {
              if (error) {
                if (cb) {
                  cb('Unauthorized')
                }
                return
              }

              if (!decoded) {
                return
              }

              const userId = decoded.id

              try {
                await userRateLimiter.consume(userId)
              } catch {
                ioLogger.info('ioroute: socket disconnect userRateLimiter', {
                  socketName,
                  data,
                  handshake: socket.handshake,
                })
                socket.disconnect()
                return
              }

              try {
                const response = await routeFunction(data, userId)

                if (response) {
                  if (cb) {
                    cb(null, response)
                  }
                }
              } catch (error) {
                const message =
                  error instanceof APIValidationError
                    ? await translateForUserId(userId, error.message)
                    : `An error occurred during a ${socketName} operation.`

                ioLogger.error('ioroute: socket routeFunction error', {
                  message,
                  socketName,
                  data,
                  handshake: socket.handshake,
                })

                if (cb) {
                  cb(message, false)
                }
              }
            }

          // @ts-expect-error the overloaded signature of jwt.verify does not accept type parameters to VerifyCallback...
          jwt.verify(data.socketToken, config.jwt.secret, verifyCallback)
        } catch (err) {
          ioLogger.error(
            'ioroute: socket disconnect',
            { socketName, data, handshake: socket.handshake },
            err,
          )
          socket.disconnect()
        }
      },
    )
  })
}
