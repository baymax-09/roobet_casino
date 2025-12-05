import { handleActions, createAction } from 'redux-actions'
import produce from 'immer'
import { type Reducer } from 'redux'

import { getMultiplierElapsed } from 'app/util'

export const setCrashBetsAction = 'crash/setBets'
export const setCrashBets = createAction(setCrashBetsAction)

export const updateCrashBetAction = 'crash/updateCrash'
export const updateCrashBets = createAction(updateCrashBetAction)

export const setCrashStateAction = 'crash/setState'
export const setCrashState = createAction(setCrashStateAction)

export const setLastCrashPointsAction = 'crash/setCrashPoints'
export const setLastCrashPoints = createAction(setLastCrashPointsAction)

export const setLastCrashPointAction = 'crash/setCrashPoint'
export const setLastCrashPoint = createAction(setLastCrashPointAction)

const initialState = {
  state: 'loading',
  bets: {},
  lastCrashPoints: [],
}

function formatBet(b) {
  if (b.cashoutCrashPoint) {
    b.cashedOut = true
    b.cashoutElapsed = getMultiplierElapsed(b.cashoutCrashPoint)
  }

  return b
}

export const crashReducer: Reducer<unknown> = handleActions(
  {
    [setCrashStateAction]: (state, { payload }) =>
      produce(state, draft => {
        draft.state = payload
      }),

    [setLastCrashPointsAction]: (state, { payload }) =>
      produce(state, draft => {
        draft.lastCrashPoints = payload
      }),

    [setLastCrashPointAction]: (state, { payload }) =>
      produce(state, draft => {
        draft.lastCrashPoints.unshift(payload)
        if (draft.lastCrashPoints.length > 25) {
          draft.lastCrashPoints.pop()
        }
      }),

    [setCrashBetsAction]: (state, { payload }) =>
      produce(state, draft => {
        draft.bets = {}

        for (const bet of payload) {
          draft.bets[bet.userId] = formatBet(bet)
        }
      }),

    [updateCrashBetAction]: (state, { payload }) =>
      produce(state, draft => {
        const bet = formatBet(payload)

        if (!(bet.payoutValue && !draft.bets[bet.userId])) {
          if (!draft.bets[bet.userId] && bet.betAmount) {
            draft.bets[bet.userId] = bet
          } else {
            draft.bets[bet.userId] = Object.assign(draft.bets[bet.userId], bet)
          }
        }
      }),
  },
  initialState,
)
