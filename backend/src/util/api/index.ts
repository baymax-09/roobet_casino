import type * as core from 'express-serve-static-core'
import { type Server } from 'socket.io'
import type Passport from 'passport'
import { type Request, type Response, type NextFunction } from 'express'

import { type User } from 'src/modules/user/types/User'
import { passport } from 'src/system'
import {
  type ModuleLogger,
  scopedLogger,
  type ScopedLogger,
} from 'src/system/logger'
import { LockedProcessError, APIValidationError } from 'src/util/errors'

export type Router = core.Router
export type RouterApp = core.Express
export type RouterPassport = Passport.PassportStatic
export type RouterIO = Server
export type RouterExpress = () => core.Express
export interface RoobetReq extends core.Request {
  user: User
}
export function isRoobetReq(req: any): req is RoobetReq {
  return !!req && !!req.user && !!req.user.id
}
export type RoobetRes = core.Response
export type Next = core.NextFunction

const apiLogger = scopedLogger('api')

const dontCare = [
  'roulette/getActiveGame',
  'roulette/recentNumbers',
  'crash/getActiveGame',
  'crash/recentNumbers',
  'bet/getRecentBetHistory',
  'bet/getUserHistory',
  'towers/gameboardLayout',
  'account/transactions',
  'account/depositHistory',
  'account/withdrawHistory',
  'promo/admin/getCodes',
  'softswiss/games/get',
  'softswiss/favorites/get',
  'races/get',
  'account/get',
  'account/publicProfile',
  'admin/user/lookup',
  'getGameById',
  'raffle',
  'rain/',
  'account/setBalanceField',
  'tpgames',
  'mutes/get',
  'admin/notes/userNotes',
  'admin/user/raffle/tickets',
  'bet/leaderboard/',
  'table/transactions',
  'table/bets',
  'table/withdrawals',
  'table/deposits',
  'roowards/get',
  'rbac/bundle',
] as const

const shouldLog = (pathname: string) => {
  return !dontCare.some(path => pathname.includes(path))
}

const clearCreds = (req: Request) => {
  delete req.query.token
  delete req.body.token
  delete req.body.password
  return req
}

const validatedApiCall =
  (process: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response) => {
    process(req, res)
      .then(data => {
        const logger = apiLogger('API Call', { userId: req.user?.id ?? null })
        try {
          const pathname = req.originalUrl
          if (shouldLog(pathname)) {
            const { query, body } = clearCreds(req)

            const response = res.headersSent
              ? {}
              : data || { response: { success: true } }

            logger.info(pathname, {
              query,
              body,
              ...response,
            })
          }
        } catch (err) {
          logger.error('Logging API', {}, err)
        }

        if (!res.headersSent) {
          res.json(data || { success: true })
        }
      })
      .catch(e => {
        const logger = apiLogger('API Call Error', {
          userId: req.user?.id ?? null,
        })

        clearCreds(req)
        if (
          e instanceof APIValidationError ||
          e instanceof LockedProcessError
        ) {
          let error = ''
          try {
            error = res.__(e.message, ...e.args)
          } catch (err) {
            logger.error(
              `Failed APIValidationError translation ${[e.message, ...e.args]}`,
            )
          }

          try {
            const pathname = req.originalUrl
            if (shouldLog(pathname)) {
              const { query, body } = req

              logger.error(
                pathname,
                {
                  query,
                  body,
                  error,
                },
                e,
              )
            }
          } catch (error) {
            logger.error('Logging API', {}, error)
          }

          if (e instanceof APIValidationError) {
            res.status(400).send({
              code: e.code || e.message,
              message: error || e.message,
              field: e.options.field,
            })
            return
          }

          res.status(400).send(error || e.message)
          return
        } else {
          logger.error('An error occurred in validating api call', {}, e)
        }

        try {
          const pathname = req.originalUrl
          const { query, body } = req
          if (shouldLog(pathname)) {
            logger.error(
              pathname,
              {
                query,
                body,
                response: res.__('internal_error'),
              },
              e,
            )
          }
        } catch (error) {
          logger.error('Logging API', {}, error)
        }

        if (req.user) {
          logger.error(
            `Validated API call error uid ${req.user.id} url ${
              req.url
            } params ${JSON.stringify(req.query)} body ${JSON.stringify(
              req.body,
            )}`,
            e,
          )
        } else {
          logger.error(
            `Validated API call error url ${req.url} params ${JSON.stringify(
              req.query,
            )} body ${JSON.stringify(req.body)}`,
            e,
          )
        }

        res.status(500).send(res.__('internal_error'))
      })
  }

/**
 * Simple wrapper for Express RequestHandlers to simplify handling promises and logging. Much simpler than
 * {@link validatedApiCall} and doesn't do anything with `res`.
 */
const scopedAsyncCallback =
  (moduleLogger: ModuleLogger) =>
  (
    process: (
      req: Request,
      res: Response,
      next: NextFunction,
      logger: ScopedLogger,
    ) => Promise<void>,
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    const logger = moduleLogger(req.originalUrl, {
      userId: null,
      path: req.originalUrl,
    })
    process(req, res, next, logger)
      .then(() => {
        const pathname = req.originalUrl
        if (shouldLog(pathname)) {
          const { query, body, headers } = clearCreds(req)

          logger.info('callback', { path: pathname, query, body, headers })
        }
      })
      .catch(err => {
        const pathname = req.originalUrl
        const { query, body, headers } = clearCreds(req)

        logger.error('error', { path: pathname, query, body, headers }, err)
      })
  }

/**
 * Legacy Passport-esque middleware combined with utility wrappers.
 *
 * @todo separate middleware from utility functions
 */
export const api = {
  check: function (
    req: Request,
    res: Response,
    next: NextFunction,
    options: Passport.AuthenticateOptions = {},
    callback?: (...args: any[]) => any,
  ) {
    passport.authenticate('token', options, callback)(req, res, next)
  },

  /**
   * Async wrapper for internal REST endpoints, contains error handling, retry logic, and translation logic.
   */
  validatedApiCall,
  asyncCallback: scopedAsyncCallback(apiLogger),
  scopedAsyncCallback,
}
