import { type OneOffEvent } from '../actions'

interface EndSessionRequest {
  action: 'EndSession'
  secret: string
  externalPlayerId: string
  externalSessionId: string
  gameSessionId: string
  currency: string
  gameId: number
}

interface EndSessionResponse {
  statusCode: number
  statusMessage: string
}

export const END_SESSION_EVENT: OneOffEvent<
  EndSessionRequest,
  EndSessionResponse
> = {
  process: async () => {
    // No business logic necessary.

    return {
      statusCode: 0,
      statusMessage: '',
    }
  },
}
