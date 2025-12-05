import { createAdapter } from 'socket.io-redis'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { Server } from 'socket.io'

import { config } from 'src/system/config'
import { sessionMiddleware } from 'src/util/middleware'
import { getIpFromRequest } from 'src/modules/fraud/geofencing'

import { scopedLogger } from './logger'
import { server } from './express'
import { socketsClient } from './redis'

const allowedOrigins = [...config.appSettings.allowedOrigins]
export const io = new Server(server, {
  maxHttpBufferSize: 1e3,
  allowEIO3: true,
})

export const pub = socketsClient()
export const sub = socketsClient()

// TODO allow each module to declare its own namespaces instead of hard-coding
export const socketNamespaces = {
  '/crash': io.of('/crash'),
  '/hotbox': io.of('/hotbox'),
  '/roulette': io.of('/roulette'),
  '/coinflip': io.of('/coinflip'),
}

export const isValidSocketNamespaceKey = (
  ns: string,
): ns is keyof typeof socketNamespaces => {
  return Object.keys(socketNamespaces).includes(ns)
}

const logger = scopedLogger('system/sockets')('loadSocketClient', {
  userId: null,
})
export async function loadSocketClient() {
  io.adapter(createAdapter({ pubClient: pub, subClient: sub }))

  const memoryRateLimiter = new RateLimiterMemory({
    points: 100, // Max message per duration
    duration: 10, // Per second(s)
    keyPrefix: 'rlm', // must be unique for limiters with different purpose
  })

  // Allowed origin middleware
  io.use((socket, next) => {
    const origin = socket.handshake.headers.origin
    if (origin) {
      for (const allowedOrigin of allowedOrigins) {
        const isExactMatch =
          typeof allowedOrigin === 'string' && origin === allowedOrigin
        const isRegExpMatch =
          allowedOrigin instanceof RegExp && allowedOrigin.test(origin)
        if (isExactMatch || isRegExpMatch) {
          next()
          return
        }
      }
    }
    logger.error('Socket connection attempt from disallowed origin', { origin })
    socket.disconnect()
  })

  io.on('connection', socket => {
    socket.use(async (packet, next) => {
      const clientIP = await getIpFromRequest(socket.handshake, 'local')

      if (clientIP === 'local') {
        logger.info('socketio: no known ip', {
          handshake: socket.handshake,
          packet,
        })
      }

      try {
        await memoryRateLimiter.consume(clientIP)
      } catch (err) {
        logger.error(
          'socketio: memoryRateLimiter disconnected',
          { handshake: socket.handshake, packet },
          err,
        )
        socket.disconnect()
      }
      logger.info('socketio packet passed through:', { packet })
      next()
    })
  })

  Object.values(socketNamespaces).forEach(namespace =>
    namespace.use((socket, next) => {
      // @ts-expect-error socket.request
      sessionMiddleware(socket.request, {}, next)
    }),
  )
}

export async function loadSocketMiddleware(): Promise<void> {
  io.use((socket, next) => {
    // @ts-expect-error socket.request
    sessionMiddleware(socket.request, {}, next)
  }).on('connection', async socket => {
    // @ts-expect-error session injected from sessionMiddleware above
    if (!socket.request.session) {
      return
    }
    // @ts-expect-error session injected from sessionMiddleware above
    const { passport } = socket.request.session

    if (passport) {
      socket.join(passport.user)
    }
  })
}
