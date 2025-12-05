import type express from 'express'

import { config } from 'src/system'
import { t } from 'src/util/i18n'
import { APIValidationError } from 'src/util/errors'
import { type RoobetReq } from 'src/util/api'

import { check2faIfEnabled } from 'src/modules/auth'

export function twoFactorCheck(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const { user } = req as RoobetReq

  if (user.specialTipSender) {
    next()
    return
  }

  check2faIfEnabled(user, req.body.twoFactorToken || req.query.twoFactorToken)
    .then(() => {
      next(null)
    })
    .catch(err => {
      let error
      if (err instanceof APIValidationError) {
        error = res.__(err.message, ...err.args)
      }
      res.status(400).send(error || err)
    })
}

export async function require2faEnabled(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  if (config.isProd || config.isStaging) {
    const { user } = req as RoobetReq

    if (!user.twofactorEnabled) {
      res.status(400).send(t(user, 'auth__2fa_required'))
      return
    }
  }
  next()
}
