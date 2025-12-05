import { createMachine } from 'xstate'

import { type User } from 'src/modules/user/types'

import { type SlotegratorAction } from '../documents/slotegratorActions'
import { SLOTEGRATOR_EVENTS } from './actions'
import { FSMError } from '../../common'
import { type ActiveBet } from 'src/modules/bet/documents/activeBetsMongo'

interface Context {
  user: User
  request: any
  action: SlotegratorAction
  activeBet: ActiveBet
}

/**
 * Create a generalize FSM for handling third-party provider
 * callback events with actions specific to Slotegrator. For more
 * information, see this module's README.
 */
export const createActionsFSM = (initial: string, context: Context) => {
  return createMachine<Context>(
    {
      id: 'slotegratorEvents',
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
            rollback: {
              target: 'playing',
            },

            refund: {
              target: 'refunded',
              actions: ['refund'],
            },

            win: {
              target: 'game_over',
              actions: ['win'],
            },

            settle: {
              target: 'settled',
              actions: ['settle_loss'],
            },
          },
        },

        game_over: {
          on: {
            // Self-transition, no actions.
            win: {
              target: 'game_over',
            },

            settle: {
              target: 'settled',
              actions: ['settle'],
            },

            rollback: {
              target: 'playing',
              actions: ['rollback'],
            },
          },
        },

        refunded: {
          on: {
            // Self-transition, no actions.
            refund: {
              target: 'refunded',
            },

            settle: {
              target: 'settled',
              actions: ['settle'],
            },

            rollback: {
              target: 'playing',
              actions: ['rollback'],
            },
          },
        },

        /* Terminal state. We cannot mark this a final or state transitions will fail. */
        settled: {
          meta: {
            terminal: true,
          },
          on: {
            // Self-transition, no actions.
            settle: {
              target: 'settled',
            },
          },
        },
      },
    },
    {
      actions: {
        bet: async args => {
          await SLOTEGRATOR_EVENTS.bet.process(args)
        },
        refund: async args => {
          await SLOTEGRATOR_EVENTS.refund.process(args)
        },
        rollback: async args => {
          await SLOTEGRATOR_EVENTS.rollback.process(args)
        },
        settle: async args => {
          await SLOTEGRATOR_EVENTS.settle.process(args)
        },
        win: async args => {
          await SLOTEGRATOR_EVENTS.win.process(args)
        },
        settle_loss: async args => {
          await SLOTEGRATOR_EVENTS.settle_loss.process(args)
        },
      },
    },
  )
}
