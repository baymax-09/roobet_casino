import { createMachine } from 'xstate'

import { type User } from 'src/modules/user/types'

import { type SlotegratorSlotsAction } from '../documents/slotegratorSlotsActions'
import { FSMError } from '../../common'

interface Context {
  user: User
  request: any
  action: SlotegratorSlotsAction
}

/**
 * Create a generalize FSM for handling third-party provider
 * callback events with actions specific to Slotegrator. For more
 * information, see this module's README.
 */
export const createActionsFSM = (initial: string, context: Context) => {
  return createMachine<Context>(
    {
      id: 'slotegratorSlotsEvents',
      strict: true,
      initial,
      context,
      on: {
        '*': {
          cond: (_, event, meta) => {
            throw new FSMError(
              `Cannot transition from "${meta.state.value}" via "${event.type}" event.`,
            )
          },
        },
      },
      states: {
        waiting: {
          on: {
            bet: {
              target: 'playing',
              actions: ['bet'],
            },

            // Refund, but we need to check if bet exists before crediting.
            refund: {
              target: 'refunded',
              actions: ['refund'],
            },
          },
        },

        playing: {
          on: {
            // Self-transition, no actions.
            bet: {
              target: 'playing',
            },

            // Self-transition, no actions.
            refund: {
              target: 'refunded',
              actions: ['refund'],
            },

            win: {
              target: 'game_over',
              actions: ['win'],
            },
          },
        },

        game_over: {
          meta: {
            terminal: true,
          },
          on: {
            // Self-transition, no actions.
            win: {
              target: 'game_over',
            },
          },
        },

        refunded: {
          meta: {
            terminal: true,
          },
          on: {
            // Self-transition, no actions.
            refund: {
              target: 'refunded',
            },
          },
        },
      },
    },
    {
      actions: {
        bet: ({ request, action, user }) => null,
        win: ({ request, action, user }) => null,
        refund: ({ request, action, user }) => null,
      },
    },
  )
}
