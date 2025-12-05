import { type NextFunction, type Request, type Response } from 'express'

import { slackAdminLog } from 'src/vendors/slack'
import { require2faEnabled } from 'src/modules/auth/middleware'
import {
  isRoleAccessPermitted,
  validateRBACUser,
  type RBACRequests,
} from 'src/modules/rbac'

import { adminLogger } from '../lib/logger'

export function logAdminAction(req: Request, _: Response, next: NextFunction) {
  const newReq = req
  delete newReq.query.token
  const message =
    `*${newReq.user?.name}* [${newReq.user?.id}]\n` +
    '*Route*: ' +
    newReq.path +
    '\n*Query*: ' +
    JSON.stringify(newReq.query) +
    '\n*Body*: ' +
    JSON.stringify(newReq.body)

  slackAdminLog(message)

  next()
}

export function roleCheck(requests: RBACRequests) {
  const _roleCheck = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(400).send('Restricted')
      return
    }

    const user = req.user

    const validRBACUserResponse = validateRBACUser(user)
    if (!validRBACUserResponse.success) {
      res.status(400).send(`Access denied. ${validRBACUserResponse.message}.`)
      return
    }

    isRoleAccessPermitted({ user, requests })
      .then(permit => {
        if (!permit) {
          res.status(400).send('Restricted')
          return
        }
        next()
      })
      .catch(error => {
        adminLogger('roleCheck', { userId: user.id }).error(
          'isRoleAccessPermitted callback',
          {},
          error,
        )
      })
  }

  return [_roleCheck, require2faEnabled]
}
