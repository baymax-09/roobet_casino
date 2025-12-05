import { type Request } from 'express'
import { getBackendBase, getFrontendBase } from 'src/modules/auth/lib/oauth'

export const uniboRequestQueryHandler = (request: Request) => {
  const parsedParams: Record<string, string | null> = {
    campaign_id: null,
    redirect_url: null,
  }
  const { campaign_id, redirect_url } = request.query

  if (campaign_id && typeof campaign_id === 'string') {
    parsedParams.campaign_id = campaign_id
  }

  if (redirect_url && typeof redirect_url === 'string') {
    const potentialRedirect = new URL(redirect_url)
    const isInternalRedirect =
      potentialRedirect.origin === getFrontendBase(request)
    const isApiRedirect = potentialRedirect.origin === getBackendBase(request)
    const isGovernedRedirect = isInternalRedirect || isApiRedirect
    parsedParams.redirect_url = isGovernedRedirect ? redirect_url : null
  }

  return parsedParams
}

export const ouroborosPath = (request: Request) => {
  const { campaign_id, redirect_url } = uniboRequestQueryHandler(request)

  // the nested 'redirect_url' param is difficult for frontend, encoding it
  return `${getBackendBase(request)}/${encodeURIComponent(
    `campaigns/opt-in?campaign_id=${campaign_id}&redirect_url=${redirect_url}`,
  )}`
}

// Unibo documentation requests that the request_id be idempotent
// but does not say why that is the case.  Since we are not storing documents
// for this route at time of integration, I am using this simple amalgam
export const createUniboRequestId = (campaign_id: string, playerId: string) => {
  return `${campaign_id}-${playerId}`
}

// No current need for this function.
// export const parseUniboRequestId = (requestId: string) => {
//   const [campaign_id, playerId] = requestId.split('-')
//   return { campaign_id, playerId }
// }
