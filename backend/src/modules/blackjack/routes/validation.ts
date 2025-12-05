import { type Request, type RequestHandler } from 'express'
import { type RoobetReq } from 'src/util/api'
import {
  BlackjackAggregateError,
  BlackjackError,
  BlackjackInvalidGameIdError,
  BlackjackInvalidHandError,
  BlackjackInvalidRequestError,
  BlackjackNonGamePlayerError,
} from '../types/errors'
import { HandActionType } from '../types/player'
import {
  isBlackjackActionRequest,
  isBlackjackInsureRequest,
  isBlackjackStartGameRequest,
} from '../types/requests'

const logScope = 'blackjack-validation'

export const checkStartCall: RequestHandler = (req, _res, next) => {
  const errors: BlackjackError[] = []
  const [gameId, error] = getGameIdOrDefaultWithError(req)
  if (error) {
    errors.push(error)
  }

  if (!isBlackjackStartGameRequest(req)) {
    errors.push(new BlackjackInvalidRequestError(gameId, logScope))
  } else {
    const {
      user,
      body: { seats: seatRequests },
    } = req
    if (!seatRequests.find(seat => seat.playerId === user.id)) {
      errors.push(new BlackjackNonGamePlayerError(logScope, gameId, user.id))
    }
  }

  if (errors.length > 0) {
    throw BlackjackError.logAndReturnForClient(
      new BlackjackAggregateError(gameId, logScope, errors),
    )
  }

  next()
}

export const checkHandAction = (action: HandActionType): RequestHandler => {
  return (req, _res, next) => {
    const errors: BlackjackError[] = []
    const [gameId, error] = getGameIdOrDefaultWithError(req)
    if (error) {
      errors.push(error)
    }

    if (!isBlackjackActionRequest(req)) {
      errors.push(new BlackjackInvalidRequestError(gameId, logScope))
    }

    if (action === HandActionType.Insurance && !isBlackjackInsureRequest(req)) {
      errors.push(new BlackjackInvalidRequestError(gameId, logScope))
    }

    const {
      user,
      body: { handIndex },
    } = req as RoobetReq
    if (handIndex === undefined || handIndex < 0) {
      errors.push(
        new BlackjackInvalidHandError(
          gameId,
          logScope,
          user.id,
          handIndex,
          action,
        ),
      )
    }

    if (errors.length > 0) {
      throw BlackjackError.logAndReturnForClient(
        new BlackjackAggregateError(gameId, logScope, errors),
      )
    }

    next()
  }
}

export const checkGameId: RequestHandler = (req, _res, next) => {
  checkGameIdCore(req)
  next()
}

function getGameIdOrDefaultWithError(
  req: Request,
): [string, BlackjackError | null] {
  try {
    return [checkGameIdCore(req), null]
  } catch (err) {
    return ['missing-game-id', err]
  }
}

function checkGameIdCore(req: Request): string {
  const {
    params: { gameId },
  } = req
  if ((!gameId && typeof gameId !== 'string') || gameId.length === 0) {
    throw new BlackjackInvalidGameIdError(logScope, gameId)
  }
  return gameId
}
