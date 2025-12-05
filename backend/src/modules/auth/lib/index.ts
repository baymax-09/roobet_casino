import { type Request, type Response } from 'express'

import { config, getFrontendDomainFromReq } from 'src/system'
import { type User } from 'src/modules/user/types'

export function setLinkCookies(req: Request, res: Response) {
  const domain = getFrontendDomainFromReq(req)

  if (config.isProd || config.isStaging) {
    res.cookie('accountLinkSuccess', true, { domain })
  } else {
    res.cookie('accountLinkSuccess', true)
  }
}

export function setAuthCookies(req: Request, res: Response, user: User) {
  const domain = getFrontendDomainFromReq(req)

  res.cookie('twofactorRequired', !!user.twofactorEnabled, { domain })
}
