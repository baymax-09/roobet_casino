import session, { type SessionData } from 'express-session'
import ConnectRedis from 'connect-redis'

import { redis, redisSecondary } from 'src/system/redis'

import {
  touchUserSession,
  removeUserSessionBySid,
} from 'src/modules/auth/documents/user_session'
import { type RoobetSessionData } from '../middleware'

const noop = () => undefined

const RedisStore = ConnectRedis(session)

/**
 * Secondary store for sessions keys. While we are migrating off GCP, we need to record
 * 30 days of session key history so users are not logged out after the swap.
 *
 * See additions to SessionStore below.
 *
 * One we are off GCP & fully using Elasticache in prod this can be ripped out.
 */
const secondaryStore = redisSecondary
  ? new RedisStore({ client: redisSecondary })
  : undefined

/**
 * Tracks sessions based on a user allowing us to potentially let them view all their active sessions or logout of all
 * sessions
 *
 * @note @types/connect-redis are not accurate: it does not correctly make RedisStore a sub-class of express.Store.
 * Specifically: get, set, touch, and destroy are, in fact, implemented on RedisStore but marked as abstract.
 * connect-redis@7 is in TypeScript! But when I tried it out it broke sessions, so we'll try that again later.
 */
// @ts-expect-error see docstring
class SessionStore extends RedisStore {
  override async set(sid: string, session: SessionData, cb = noop) {
    // Store session in secondary.
    secondaryStore?.set(sid, session, cb)

    // @ts-expect-error @types/redis-connect is wrong, the set method is not abstract.
    super.set.call(this, sid, session, cb)
  }

  override touch(
    sid: string,
    session: RoobetSessionData,
    cb: () => void = noop,
  ) {
    if (session.passport?.user) {
      const { user } = session.passport

      touchUserSession(sid, user, session)
    }

    // Touch session in secondary.
    secondaryStore?.touch?.(sid, session, cb)

    // Call parent method.
    super.touch?.call(this, sid, session, cb)
  }

  destroy(sid: string, cb: () => void = noop) {
    removeUserSessionBySid(sid)

    // Destroy session in secondary.
    secondaryStore?.destroy(sid, cb)

    // @ts-expect-error @types/redis-connect is wrong, the destroy method is not abstract.
    super.destroy.call(this, sid, cb)
  }
}

export const sessionStore = new SessionStore({ client: redis })
