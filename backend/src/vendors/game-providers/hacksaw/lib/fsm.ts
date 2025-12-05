import { createMachine, interpret } from 'xstate'

import { type User } from 'src/modules/user/types'

import { type HacksawActionDocument } from '../documents/hacksawActions'
import { HACKSAW_STATE_MACHINE_EVENTS } from './actions'

interface Context {
  user: User
  request: any
  action: HacksawActionDocument
}

/**
 * Create a generalize FSM for handling third-party provider
 * callback events with actions specific to Hacksaw. For more
 * information, see this module's README.
 */
export const createActionsFSM = (initial: string, context: Context) => {
  return createMachine<Context>(
    {
      id: 'hacksawEvents',
      strict: true,
      initial,
      context,
      states: {
        waiting: {
          on: {
            Rollback: {
              target: 'rolled_back_pre_bet',
            },
            Win: {
              target: 'win_pre_bet',
            },
            Bet: {
              target: 'playing',
              actions: ['Bet'],
            },
          },
        },

        win_pre_bet: {
          always: [
            { target: 'game_over', cond: 'isFreebet', actions: ['Win'] },
            { target: 'win_pre_bet_non_freebet', cond: 'isNotFreebet' },
          ],
        },
        win_pre_bet_non_freebet: {
          on: {
            Rollback: {
              target: 'rolled_back_pre_bet_post_win',
            },
            Bet: {
              target: 'game_over',
              actions: ['Bet', 'Win'],
            },
          },
        },

        rolled_back_pre_bet_post_win: {
          on: {
            Bet: {
              target: 'rolled_back',
              actions: ['Bet', 'Win', 'Rollback'],
            },
          },
        },

        rolled_back_pre_bet: {
          on: {
            Rollback: {
              target: 'rolled_back_pre_bet',
            },
            Win: {
              target: 'win_pre_bet_post_rollback',
            },
            Bet: {
              target: 'rolled_back',
              actions: ['Bet', 'Rollback'],
            },
          },
        },

        win_pre_bet_post_rollback: {
          always: [
            { target: 'bet_rollback_pre_bet', cond: 'isBetRollback' },
            { target: 'win_rollback_pre_bet', cond: 'isWinRollback' },
          ],
        },

        win_rollback_pre_bet: {
          on: {
            Bet: {
              target: 'rolled_back',
              actions: ['Bet', 'Win', 'Rollback'],
            },
          },
        },

        bet_rollback_pre_bet: {
          on: {
            Bet: {
              target: 'rolled_back',
              actions: ['Bet', 'Rollback'],
            },
          },
        },

        playing: {
          on: {
            // Self-transition, no actions.
            Bet: {
              target: 'playing',
            },

            // Self-transition, no actions.
            Rollback: {
              target: 'rolled_back',
              actions: ['Rollback'],
            },

            Win: {
              target: 'game_over',
              actions: ['Win'],
            },
          },
        },

        game_over: {
          meta: {
            terminal: true,
          },
          on: {
            Win: {
              target: 'game_over',
            },

            Bet: {
              target: 'game_over',
            },

            Rollback: {
              target: 'rolled_back',
              actions: ['Rollback'],
            },
          },
        },

        /* Terminal state. We cannot mark this a final or state transitions will fail. */
        rolled_back: {
          meta: {
            terminal: true,
          },
          on: {
            Rollback: {
              target: 'rolled_back',
            },
            Win: {
              target: 'rolled_back',
            },
            Bet: {
              target: 'rolled_back',
            },
          },
        },
      },
    },
    {
      actions: {
        Bet: async ({ request, action, user }) =>
          await HACKSAW_STATE_MACHINE_EVENTS.Bet?.process(
            request,
            action,
            user,
          ),
        Rollback: async ({ request, action, user }) =>
          await HACKSAW_STATE_MACHINE_EVENTS.Rollback?.process(
            request,
            action,
            user,
          ),
        Win: async ({ request, action, user }) =>
          await HACKSAW_STATE_MACHINE_EVENTS.Win?.process(
            request,
            action,
            user,
          ),
      },
      guards: {
        isBetRollback: (context, event) => {
          return context?.action?.targetActionType === 'Bet'
        },
        isWinRollback: (context, event) => {
          return context?.action?.targetActionType === 'Win'
        },
        isFreebet: (context, event) => {
          return !!context?.request?.freeRoundData
        },
        isNotFreebet: (context, event) => {
          return !context?.request?.freeRoundData
        },
      },
    },
  )
}

/**
 * Create a interpretor for a given state machine, allow a single
 * transition of the given event, and process any related actions synchronously.
 *
 * For our purposes, we will only ever make a single transition per
 * callback, and as such this function strictly makes that assumption.
 */
export const sendEventAndProcessActions = async (
  machine: ReturnType<typeof createActionsFSM>,
  event: string,
) =>
  await new Promise<{ nextState: string; isDone: boolean }>(
    (resolve, reject) => {
      const service = interpret(machine, {
        execute: false,
      })

      service.onTransition(async state => {
        const { value, actions, context, event, meta } = state

        // Do not trigger for initial state.
        if (event.type === 'xstate.init') {
          return
        }

        // Process and await actions in order.
        for (const action of actions) {
          try {
            await action.exec?.(context, event, meta)
          } catch (error) {
            reject(error)
          }
        }

        // Stop service before returning.
        service.stop()

        // For our uses, the next state value should be a single item.
        if (typeof value === 'string') {
          const isDone = !!meta[`${machine.id}.${value}`]?.terminal

          resolve({
            isDone,
            nextState: value,
          })
          return
        }

        // Reject entire promise.
        reject('Next state value is invalid.')
      })

      // Start service and send event.
      service.start().send(event)
    },
  )
