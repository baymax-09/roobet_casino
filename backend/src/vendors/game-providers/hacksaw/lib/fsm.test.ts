import { createActionsFSM } from './fsm'
import { HACKSAW_STATE_MACHINE_EVENTS } from './actions'

const permutations = (arr: any[]) => {
  if (arr.length <= 2) {
    return arr.length === 2 ? [arr, [arr[1], arr[0]]] : arr
  }

  return arr.reduce(
    (acc, item, i) =>
      acc.concat(
        permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(val => [
          item,
          ...val,
        ]),
      ),
    [],
  )
}

const EVENT_PERMUTATIONS = permutations(
  Object.keys(HACKSAW_STATE_MACHINE_EVENTS),
)

const areListsEqual = (a: any[], b: any[]): boolean => {
  if (a.length !== b.length) {
    return false
  }

  // Order matters.
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}

const runStateMachineUntilTermination = (
  events: string[],
  targetActionType: string = 'Win',
) => {
  const actions: string[] = []

  const machine = createActionsFSM('waiting', {
    // These do not matter for testing.
    action: { targetActionType } as any,
    request: {} as any,
    user: {} as any,
  })

  let state = machine.initialState

  for (const event of events) {
    state = machine.transition(state, event)
    actions.push(...state.actions.map(({ type }) => type))
  }

  const isDone = !!state.meta[`${machine.id}.${state.value}`]?.terminal

  return { state, actions, isDone }
}

const EXPECTED_PATHS = [
  ['Rollback', 'Win', 'Bet'],
  ['Rollback', 'Bet'],
  ['Win', 'Rollback'],
  ['Win', 'Bet', 'Rollback'],
  ['Win', 'Bet'],
  ['Bet', 'Rollback'],
  ['Bet', 'Win', 'Rollback'],
  ['Bet', 'Win'],
]

describe('hacksaw finite state machine', () => {
  it('can run all permutations to terminal state "Win" rollback type', () => {
    for (const permutation of EVENT_PERMUTATIONS) {
      const { state, actions, isDone } = runStateMachineUntilTermination(
        permutation,
        'Win',
      )

      // Reached terminal state.
      expect(isDone).toBeTruthy()

      // Completed one of the expected paths.
      expect(
        EXPECTED_PATHS.some(path => areListsEqual(path, actions)),
      ).toBeTruthy()
    }
  })

  it('can run all permutations to terminal state "Bet" rollback type', () => {
    for (const permutation of EVENT_PERMUTATIONS) {
      const { state, actions, isDone } = runStateMachineUntilTermination(
        permutation,
        'Bet',
      )

      // Reached terminal state.
      expect(isDone).toBeTruthy()

      // Completed one of the expected paths.
      expect(
        EXPECTED_PATHS.some(path => areListsEqual(path, actions)),
      ).toBeTruthy()
    }
  })
})
