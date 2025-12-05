import { handleActions, createAction } from 'redux-actions'
import produce from 'immer'
import { type Reducer } from 'redux'

import { type SettingsResponse } from 'app/lib/settings'

export const setSettingsAction = 'settings/set'
export const setSettings = createAction(setSettingsAction)

const initialState = {
  disconnected: false,
  loaded: false,
  loadedUser: false,
  globalStats: {
    globalAmountWonPast24: 0,
    allTimeNumBets: 0,
  },
}

export const settingsReducer: Reducer<SettingsResponse & typeof initialState> =
  handleActions(
    {
      [setSettingsAction]: (state, { payload }) =>
        produce(state, draft => {
          return { ...draft, ...payload }
        }),
    },
    initialState,
  )
