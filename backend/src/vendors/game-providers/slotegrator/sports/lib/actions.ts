import { type AsyncOrSync } from 'ts-essentials'

import { type User } from 'src/modules/user/types'
import { getUserById } from 'src/modules/user'
import { type ActiveBet } from 'src/modules/bet/documents/activeBetsMongo'
import {
  updateActiveBet,
  getOrCreateActiveBet,
} from 'src/modules/bet/documents/activeBetsMongo'

import {
  deleteAction,
  getAction,
  touchAction,
  type SlotegratorAction as SlotegratorActionDocument,
  type SlotegratorActionTypesUnion,
  type BaseSlotegratorAction,
} from '../documents/slotegratorActions'
import { createActionsFSM } from './fsm'
import {
  REFUND_EVENT,
  BET_EVENT,
  ROLLBACK_EVENT,
  SETTLE_EVENT,
  WIN_EVENT,
  SETTLE_LOSS_EVENT,
} from './events'
import {
  FSMError,
  SlotegratorError,
  sendEventAndProcessActions,
} from '../../common'

export interface SlotegratorEvent<Request, Response> {
  /**
   * Callback that takes an arbitrary input and resolves to
   * a SlotegratorAction document.
   */
  resolveAction: (request: Request) => BaseSlotegratorAction

  /**
   * Callback that handles business logic, assuming action is
   * processed in expected order.
   */
  process: (args: {
    request: Request
    action: SlotegratorActionDocument
    user: User
    activeBet: ActiveBet
  }) => Promise<void>

  /**
   * Callback that resolves the HTTP response necessary for the provider integration.
   */
  resolveResponse: (args: {
    request: Request
    action: SlotegratorActionDocument
    user: User
    activeBet: ActiveBet
  }) => AsyncOrSync<Response>
}

type ExtendedSlotegratorActions = 'settle_loss'

type ProcessableSlotegratorActions =
  | Exclude<SlotegratorActionTypesUnion, 'balance' | 'close'>
  | ExtendedSlotegratorActions

/**
 * Set of actions that are required for the slotegrator FSM.
 */
export const SLOTEGRATOR_EVENTS: Record<
  ProcessableSlotegratorActions,
  SlotegratorEvent<any, any>
> = {
  bet: BET_EVENT,
  refund: REFUND_EVENT,
  rollback: ROLLBACK_EVENT,
  settle: SETTLE_EVENT,
  win: WIN_EVENT,
  settle_loss: SETTLE_LOSS_EVENT,
}

const isValidEvent = (event: string): event is ProcessableSlotegratorActions =>
  event in SLOTEGRATOR_EVENTS

/**
 * Handle incoming Slotegrator actions.
 *
 * 1. verify we can process the given event
 * 2. resolve the request and store an action document
 * 3. create an active bet record if one does not exist
 * 4. process the state transition for the given event
 * 5. resolve the response, regardless of step #4
 */
export const handleSlotegratorEvent = async (
  event: string,
  request: object & {
    player_id: string
    betslip_id: string
    session_id?: string
  },
): Promise<object> => {
  if (!isValidEvent(event)) {
    throw new SlotegratorError('Unsupported action.')
  }

  const user = await getUserById(request.player_id)

  if (!user) {
    throw new SlotegratorError('Cannot find user.')
  }

  const eventConfig = SLOTEGRATOR_EVENTS[event]

  // Resolve and write action record.
  const actionPayload = eventConfig.resolveAction(request)

  // Create action document or lookup existing if possible.
  const { action: actionDocument, existed } = await touchAction(actionPayload)

  if (!actionDocument) {
    throw new Error('Failed to write or load action document.')
  }

  const activeBet = await getOrCreateActiveBet({
    externalIdentifier: request.betslip_id,
    externalSessionId: request.session_id,
    userId: request.player_id,
  })

  // Else, process event and return with updated information.
  try {
    const fsm = createActionsFSM(activeBet.state, {
      request,
      user,
      action: actionDocument,
      activeBet,
    })

    const { nextState, isDone } = await sendEventAndProcessActions(fsm, event)

    // Update ActiveBet record with nextState and close out if in terminal state.
    if (activeBet.state !== nextState) {
      await updateActiveBet(activeBet._id, {
        state: nextState,
        closedOut: isDone ? new Date() : undefined,
      })
    }
  } catch (error) {
    // If processing the event fails, we need to delete the action document.
    if (!existed) {
      await deleteAction(actionDocument._id)
    }

    // Do not pass FSMError messages up to express error handler.
    if (error instanceof FSMError) {
      throw new SlotegratorError('Unexpected event, cannot process action.')
    }

    // Bubble up error to express middleware.
    throw error
  }

  // We need to re-fetch the user and action to get up to date record.
  const updatedUser = await getUserById(user.id)

  if (!updatedUser) {
    throw new SlotegratorError('Cannot find updated user.')
  }

  const updatedActionDocument = await getAction({ _id: actionDocument._id })

  if (!updatedActionDocument) {
    throw new SlotegratorError('Cannot find updated action document.')
  }

  return eventConfig.resolveResponse({
    request,
    action: updatedActionDocument,
    user: updatedUser,
    activeBet,
  })
}
