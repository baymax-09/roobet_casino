import { type User } from 'src/modules/user/types'
import { getUserById } from 'src/modules/user'
import {
  deleteActiveBet,
  getOrCreateActiveBet,
  updateActiveBet,
} from 'src/modules/bet/documents/activeBetsMongo'

import { getUserFromAuthToken } from './auth'
import {
  deleteAction,
  getAction,
  touchAction,
  HacksawActionTypes,
  type HacksawActionDocument,
  type HacksawActionType,
  type BaseHacksawAction,
} from '../documents/hacksawActions'
import {
  type StateMachineRequest,
  getBetIdentifier,
  getGameIdentifier,
} from './helpers'
import {
  AUTHENTICATE_EVENT,
  BALANCE_EVENT,
  BET_EVENT,
  ROLLBACK_EVENT,
  WIN_EVENT,
  END_SESSION_EVENT,
} from './events'
import { HacksawErrorCodes, FSMError, HacksawError } from './errors'
import { createActionsFSM, sendEventAndProcessActions } from './fsm'
import { hacksawLogger } from './logger'

export interface HacksawEvent<Request, Response> {
  /**
   * Callback that takes an arbitrary input and resolves to
   * a HacksawAction document.
   */
  resolveAction: (request: Request, user: User) => Promise<BaseHacksawAction>

  /**
   * Callback that handles business logic, assuming action is
   * processed in expected order.
   *
   * Can optionally return a response (as is useful for non-state-machine events such as balance request)
   */
  process: (
    request: Request,
    action: HacksawActionDocument,
    user: User,
  ) => Promise<null | Response>

  /**
   * Callback that resolves the HTTP response necessary for the provider integration.
   */
  resolveResponse: (
    request: Request,
    action: HacksawActionDocument,
    user: User,
  ) => Promise<Response>
}

export interface OneOffEvent<Request, Response> {
  /**
   * a non-state machine event simply processes and returns a response.
   */
  process: (request: Request, user: User) => Promise<Response>
}

export const HACKSAW_ONE_OFF_EVENTS: Partial<
  Record<HacksawActionType, OneOffEvent<any, any>>
> = {
  Authenticate: AUTHENTICATE_EVENT,
  Balance: BALANCE_EVENT,
  EndSession: END_SESSION_EVENT,
}

/**
 * Set of actions that are required for the hacksaw FSM.
 */
export const HACKSAW_STATE_MACHINE_EVENTS: Partial<
  Record<HacksawActionType, HacksawEvent<any, any>>
> = {
  Bet: BET_EVENT,
  Rollback: ROLLBACK_EVENT,
  Win: WIN_EVENT,
}

const isValidEvent = (event: string): event is HacksawActionType =>
  HacksawActionTypes.includes(event as HacksawActionType)

interface GeneralHacksawRequest {
  action: string
  token: string
  externalPlayerId: string
  gameId?: number
}

/**
 * Handle incoming Hacksaw actions.
 *
 * 1. verify we can process the given event
 * 2. resolve the request and store an action document
 * 3. create an active bet record if one does not exist
 * 4. process the state transition for the given event
 * 5. resolve the response, regardless of step #4
 */
export const handleHacksawEvent = async (
  event: string,
  request: GeneralHacksawRequest,
): Promise<object> => {
  const logger = hacksawLogger('handleHacksawEvent', {
    userId: request.externalPlayerId,
  })
  if (!isValidEvent(event)) {
    throw new HacksawError('Invalid action', HacksawErrorCodes.InvalidAction)
  }

  const user = request.token
    ? await getUserFromAuthToken(request.token)
    : await getUserById(request.externalPlayerId)

  if (!user) {
    throw new HacksawError(
      'Cannot find user.',
      HacksawErrorCodes.InvalidUserOrTokenExpired,
    )
  }

  // handle non-recorded events such as balance, authenticate, endsession
  // doesn't require resolveAction or resolveResponse.
  const oneOffEvent = HACKSAW_ONE_OFF_EVENTS[event]
  if (oneOffEvent) {
    const response = await oneOffEvent.process(request, user)
    logger.info('oneOffEvent', { response })
    return response
  }

  const stateMachineEvent = HACKSAW_STATE_MACHINE_EVENTS[event]
  if (!stateMachineEvent) {
    throw new HacksawError('Invalid Event', HacksawErrorCodes.InvalidAction)
  }
  // Resolve and write action record.
  const actionPayload = await stateMachineEvent.resolveAction(request, user)
  actionPayload.userId = user.id ?? ''

  // Create action document or lookup existing if possible.
  const { action: actionDocument, existed } = await touchAction(actionPayload)

  if (!actionDocument) {
    throw new Error('Failed to write or load action document.')
  }

  const activeBet = await getOrCreateActiveBet({
    externalIdentifier: getBetIdentifier(
      request as unknown as StateMachineRequest,
    ),
    gameIdentifier: getGameIdentifier(request.gameId ?? 0),
    userId: user.id,
  })

  if (!existed) {
    // Else, process event and return with updated information.
    try {
      const fsm = createActionsFSM(activeBet.state, {
        request,
        user,
        action: actionDocument,
      })

      const { nextState } = await sendEventAndProcessActions(fsm, event)

      // Update ActiveBet record with nextState and close out if in terminal state.
      if (activeBet.state !== nextState) {
        await updateActiveBet(activeBet._id, {
          state: nextState,
        })
      }
    } catch (error) {
      // If processing the event fails, we need to delete the action document.
      if (!existed) {
        await deleteAction(actionDocument._id)

        // If the active bet was created on this request, and we failed to process it, delete the record.
        if (event === 'Bet') {
          await deleteActiveBet(activeBet._id)
        }
      }

      // Do not pass FSMError messages up to express error handler.
      if (error instanceof FSMError) {
        throw new HacksawError('Unexpected event, cannot process action.')
      }

      // Bubble up error to express middleware.
      throw error
    }
  }

  // We need to re-fetch the user and action to get up to date record.
  const updatedUser = await getUserById(user.id)

  if (!updatedUser) {
    throw new HacksawError('Cannot find updated user.')
  }

  const updatedActionDocument = await getAction({ _id: actionDocument._id })

  if (!updatedActionDocument) {
    throw new HacksawError('Cannot find updated action document.')
  }

  const stateResponse = await stateMachineEvent.resolveResponse(
    request,
    updatedActionDocument,
    updatedUser,
  )
  logger.info('stateMachineEvent', { stateResponse })
  return stateResponse
}
