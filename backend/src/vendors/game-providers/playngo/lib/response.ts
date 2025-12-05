import { type PngResponse } from '../documents/transactions'
import { playngoLogger } from './logger'

const ACTIONS = [
  'authenticate',
  'balance',
  'reserve',
  'cancelReserve',
  'release',
] as const
export type Action = (typeof ACTIONS)[number]

/**
 * xml expects an array of K=>V individual objects
 * this converts to that format
 */
export function makeResponseFromObject(
  action: Action,
  obj: PngResponse,
): object[] {
  const payload = Object.entries(obj).map(([key, val]) => {
    return { [key]: val }
  })
  playngoLogger('makeResponseFromObject', { userId: null }).info(
    `/${action} response`,
    {
      payload,
      action,
    },
  )
  return payload
}
