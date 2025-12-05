import { handleActions, createAction } from 'redux-actions'
import produce from 'immer'
import { type Reducer } from 'redux'

export const setColorsBetsAction = 'Colors/setBets'
export const setColorsBets = createAction(setColorsBetsAction)

export const updateColorsBetAction = 'Colors/updateBets'
export const updateColorsBets = createAction(updateColorsBetAction)

export const setColorsStateAction = 'Colors/setState'
export const setColorsState = createAction(setColorsStateAction)

export const setLastColorsPointsAction = 'Colors/setColorsPoints'
export const setLastColorsPoints = createAction(setLastColorsPointsAction)

export const setLastColorsPointAction = 'Colors/setColorsPoint'
export const setLastColorsPoint = createAction(setLastColorsPointAction)

const initialState = {
  state: 'loading',
  bets: [],
  lastColorsPoints: [],
}

const sortBets = (a, b) => b.betAmount - a.betAmount

export const colorsReducer: Reducer<any> = handleActions(
  {
    [setColorsStateAction]: (state, { payload }) =>
      produce(state, draft => {
        draft.state = payload
      }),

    [setLastColorsPointsAction]: (state, { payload }) =>
      produce(state, draft => {
        draft.lastColorsPoints = payload
      }),

    [setLastColorsPointAction]: (state, { payload }) =>
      produce(state, draft => {
        draft.lastColorsPoints.unshift(payload)
        if (draft.lastColorsPoints.length > 25) {
          draft.lastColorsPoints.pop()
        }
      }),

    [setColorsBetsAction]: (state, { payload }) =>
      produce(state, draft => {
        draft.bets = payload
        draft.bets.sort(sortBets)
      }),

    [updateColorsBetAction]: (state, { payload: bet }) =>
      produce(state, draft => {
        // If the bet exists, update it.
        const idx = draft.bets.reduce(
          // eslint-disable-next-line id-length
          (f, b, i) => (b.id === bet.id ? i : f),
          -1,
        )

        if (idx < 0 && !!bet.id) {
          draft.bets.push(bet)
        } else if (idx >= 0) {
          draft.bets[idx] = {
            ...draft.bets[idx],
            ...bet,
          }
        }

        draft.bets.sort(sortBets)
      }),
  },
  initialState,
)
