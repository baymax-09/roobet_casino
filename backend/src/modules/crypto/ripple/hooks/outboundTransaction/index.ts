import { RippleOutboundTransactionHooks as hooks } from './outboundTransaction'
import { type Process } from '../../../types'

type RippleOutboundTransactionMap = Record<Extract<Process, 'withdrawal'>, any>

export const RippleOutboundTransactionHooks: RippleOutboundTransactionMap = {
  withdrawal: hooks,
}
