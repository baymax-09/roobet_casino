import { createActionsFSM } from './fsm'

const EXPECTED_PATHS: Array<{
  events: string[]
  actions: string[]
  states: string[]
}> = [
  {
    events: ['refund'],
    actions: ['refund'],
    states: ['waiting', 'refunded'],
  },
  {
    events: ['bet', 'win', 'settle'],
    actions: ['bet', 'win', 'settle'],
    states: ['waiting', 'playing', 'game_over', 'settled'],
  },
  {
    events: ['bet', 'settle'],
    actions: ['bet', 'settle_loss'],
    states: ['waiting', 'playing', 'settled'],
  },
  {
    events: ['bet', 'win', 'rollback', 'win', 'settle'],
    actions: ['bet', 'win', 'rollback', 'win', 'settle'],
    states: [
      'waiting',
      'playing',
      'game_over',
      'playing',
      'game_over',
      'settled',
    ],
  },
  {
    events: ['bet', 'refund', 'settle'],
    actions: ['bet', 'refund', 'settle'],
    states: ['waiting', 'playing', 'refunded', 'settled'],
  },
  {
    events: ['bet', 'refund', 'refund', 'settle'],
    actions: ['bet', 'refund', 'settle'],
    states: ['waiting', 'playing', 'refunded', 'refunded', 'settled'],
  },
  {
    events: ['bet', 'win', 'rollback', 'rollback', 'refund', 'settle'],
    actions: ['bet', 'win', 'rollback', 'refund', 'settle'],
    states: [
      'waiting',
      'playing',
      'game_over',
      'playing',
      'playing',
      'refunded',
      'settled',
    ],
  },
  {
    events: ['bet', 'refund', 'rollback', 'win', 'settle'],
    actions: ['bet', 'refund', 'rollback', 'win', 'settle'],
    states: [
      'waiting',
      'playing',
      'refunded',
      'playing',
      'game_over',
      'settled',
    ],
  },
]

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

const runStateMachineUntilTermination = (events: string[]) => {
  const actions: string[] = []
  const states: string[] = []

  const machine = createActionsFSM('waiting', {
    // These do not matter for testing.
    action: {} as any,
    request: {} as any,
    user: {} as any,
  })

  let state = machine.initialState

  states.push(state.value as string)

  for (const event of events) {
    state = machine.transition(state, event)
    actions.push(...state.actions.map(({ type }) => type))
    states.push(state.value as string)
  }

  return { states, actions }
}

describe('slotegrator finite state machine', () => {
  it('can run all permutations to terminal state', () => {
    for (const path of EXPECTED_PATHS) {
      const { states, actions } = runStateMachineUntilTermination(path.events)

      console.log(states, path.states, actions, path.actions)

      // All expected states were reached.
      expect(areListsEqual(states, path.states)).toBeTruthy()

      // Completed one of the expected actions.
      expect(areListsEqual(actions, path.actions)).toBeTruthy()
    }
  })
})
