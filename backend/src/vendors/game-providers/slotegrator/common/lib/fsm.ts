import { type StateMachine as XStateMachine, interpret } from 'xstate'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StateMachine = XStateMachine<any, any, any>

/**
 * Create a interpretor for a given state machine, allow a single
 * transition of the given event, and process any related actions synchronously.
 *
 * For our purposes, we will only ever make a single transition per
 * callback, and as such this function strictly makes that assumption.
 */
export const sendEventAndProcessActions = async (
  machine: StateMachine,
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
