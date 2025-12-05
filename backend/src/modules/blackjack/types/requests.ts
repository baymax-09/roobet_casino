import { isRoobetReq, type RoobetReq } from 'src/util/api'
import { isPlayerSeatRequest, type PlayerSeatRequest } from './player'

export interface BlackjackStartGameRequest extends RoobetReq {
  body: {
    seats: PlayerSeatRequest[]
  }
}

export function isBlackjackStartGameRequest(
  req: any,
): req is BlackjackStartGameRequest {
  return (
    isRoobetReq(req) &&
    !!req.body &&
    !!req.body.seats &&
    Array.isArray(req.body.seats) &&
    req.body.seats.every((seat: any) => isPlayerSeatRequest(seat))
  )
}

export interface BlackjackActionRequest extends RoobetReq {
  body: {
    handIndex: number
  }
}

export function isBlackjackActionRequest(
  req: any,
): req is BlackjackActionRequest {
  return (
    isRoobetReq(req) &&
    !!req.body &&
    req.body.handIndex !== undefined &&
    typeof req.body.handIndex === 'number' &&
    req.body.handIndex >= 0
  )
}

export interface BlackjackInsureRequest extends BlackjackActionRequest {
  body: {
    handIndex: number
    accept: boolean
  }
}

export function isBlackjackInsureRequest(
  req: any,
): req is BlackjackInsureRequest {
  return (
    isBlackjackActionRequest(req) &&
    !!req.body &&
    'accept' in req.body &&
    req.body.accept !== undefined &&
    typeof req.body.accept === 'boolean'
  )
}
