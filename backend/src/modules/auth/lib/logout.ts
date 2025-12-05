import { getFrontendUrlFromReq, getBackendDomainFromReq } from 'src/system'
import { sessionStore } from 'src/util/store'
import { api } from 'src/util/api'

import { getUserSessionsByUser } from '../documents/user_session'

export const onLogout = (logoutEverywhere = false) =>
  api.validatedApiCall(async (req, res) => {
    const { user } = req
    const { redirectToLogin } = req.query

    const baseRedirect = getFrontendUrlFromReq(req)
    const apiDomain = getBackendDomainFromReq(req)

    const redirect = redirectToLogin
      ? `${baseRedirect}?modal=auth&tab=login`
      : baseRedirect

    if (user && logoutEverywhere) {
      const sessions = await getUserSessionsByUser(user.id)
        .where('destroyed', false)
        .select('sessionId')

      for (const session of sessions) {
        sessionStore.destroy(session.sessionId)
      }
    }

    // Clear user from request context.
    req.logout()

    // Delete session record.
    req.session.destroy(() => {})

    // Clear session cookie available on only the document domain.
    res.clearCookie('connect.sid', { path: '/', domain: apiDomain })

    // Clear connect.sid cookie available on document domain, and all subdomains.
    res.clearCookie('connect.sid', { path: '/' })

    // Redirect back to UI.
    res.redirect(redirect)
  })
