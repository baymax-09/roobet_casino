import { type AsyncOrSync } from 'ts-essentials'

import { type User } from 'src/modules/user/types'
import { getUserById } from 'src/modules/user'
import { type ActiveBet } from 'src/modules/bet/documents/activeBetsMongo'
import { getOrCreateActiveBet } from 'src/modules/bet/documents/activeBetsMongo'

import {
  type BaseSlotegratorSlotsAction,
  deleteAction,
  getAction,
  touchAction,
  type SlotegratorSlotsAction as SlotegratorSlotsActionDocument,
  type SlotegratorSlotsActionTypesUnion,
} from '../documents/slotegratorSlotsActions'
import { SlotegratorError } from '../../common'
import { BET_EVENT, WIN_EVENT, REFUND_EVENT, ROLLBACK_EVENT } from './events'

type SlotegratorSlotsActionMaybeRoundId = Omit<
  BaseSlotegratorSlotsAction,
  '_id' | 'roundId'
> & {
  // Optional prior to resolving.
  roundId: string | undefined
}

export interface SlotegratorSlotsEvent<Request, Response> {
  /**
   * Callback that takes an arbitrary input and resolves to
   * a SlotegratorAction document.
   */
  resolveAction: (
    request: Request,
  ) => AsyncOrSync<SlotegratorSlotsActionMaybeRoundId>

  /**
   * Callback that handles business logic, assuming action is
   * processed in expected order.
   */
  process: (
    request: Request,
    action: SlotegratorSlotsActionDocument,
    user: User,
    activeBet: ActiveBet,
  ) => AsyncOrSync<void>

  /**
   * Callback that resolves the HTTP response necessary for the provider integration.
   */
  resolveResponse: (
    request: Request,
    action: SlotegratorSlotsActionDocument,
    user: User,
    activeBet: ActiveBet,
  ) => AsyncOrSync<Response>
}

type ProcessableSlotegratorSlotsActions = Exclude<
  SlotegratorSlotsActionTypesUnion,
  'balance'
>

/**
 * Set of actions that are required for the slotegrator FSM.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SLOTEGRATOR_SLOTS_EVENTS: Record<
  ProcessableSlotegratorSlotsActions,
  SlotegratorSlotsEvent<any, any>
> = {
  bet: BET_EVENT,
  win: WIN_EVENT,
  refund: REFUND_EVENT,
  rollback: ROLLBACK_EVENT,
}

const isValidEvent = (
  event: string,
): event is ProcessableSlotegratorSlotsActions =>
  event in SLOTEGRATOR_SLOTS_EVENTS

const actionHasRoundId = (
  action: SlotegratorSlotsActionMaybeRoundId,
): action is SlotegratorSlotsActionDocument => {
  return typeof action.roundId === 'string'
}

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
    session_id: string
    round_id?: string
  },
): Promise<object> => {
  if (!isValidEvent(event)) {
    throw new SlotegratorError(`Invalid request, unsupported action ${event}.`)
  }

  const user = await getUserById(request.player_id)

  if (!user) {
    throw new SlotegratorError(
      `Invalid request, user not found with ID ${request.player_id}.`,
    )
  }

  const eventConfig = SLOTEGRATOR_SLOTS_EVENTS[event]

  // Resolve and write action record.
  const actionPayload = await eventConfig.resolveAction(request)

  if (!actionHasRoundId(actionPayload)) {
    throw new SlotegratorError(
      'Invalid request, roundId could not be resolved.',
    )
  }

  // Create action document or lookup existing if possible.
  const { action: actionDocument, existed } = await touchAction(actionPayload)

  if (!actionDocument) {
    throw new Error('Failed to write or load action document.')
  }

  const activeBet = await getOrCreateActiveBet({
    externalIdentifier: actionDocument.roundId,
    externalSessionId: actionDocument.sessionId,
    userId: actionDocument.userId,
  })

  if (activeBet.userId !== request.player_id) {
    throw new SlotegratorError('User mismatch.')
  }

  if (existed) {
    return eventConfig.resolveResponse(request, actionDocument, user, activeBet)
  }

  // Else, process event and return with updated information.
  try {
    await eventConfig.process(request, actionDocument, user, activeBet)
  } catch (error) {
    // If processing the event fails, we need to delete the action document.
    if (!existed) {
      await deleteAction(actionDocument._id)
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

  return eventConfig.resolveResponse(
    request,
    updatedActionDocument,
    updatedUser,
    activeBet,
  )
}
