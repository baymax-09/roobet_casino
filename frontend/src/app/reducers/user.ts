import { handleActions, createAction } from 'redux-actions'
import produce from 'immer'
import fromExponential from 'from-exponential'
import { type Reducer } from 'redux'

import { endSession } from 'app/lib/user'
import { UserObjectBalanceFields, type User } from 'common/types'
export const setUserAction = 'user/setUser'
export const setUser = createAction(setUserAction)
export const updateMatchPromoAction = 'user/updateMatchPromo'
export const updateMatchPromo = createAction(updateMatchPromoAction)
export const logoutAction = 'user/logout'
export const logout = createAction(logoutAction)
export const addNotificationAction = 'user/addNotification'
export const addNotification = createAction(addNotificationAction)
export const markNotificationsReadAction = 'user/readNotifications'
export const markNotificationsRead = createAction(markNotificationsReadAction)
export const changeUserSettingAction = 'user/changeUserSetting'
export const changeUserSetting = createAction(changeUserSettingAction)

const initialState = null

/** @todo delete me */
function normalizeUser(user) {
  for (const b of UserObjectBalanceFields) {
    if (user[b]) {
      user[b] = parseFloat(fromExponential(user[b]).substring(0, 8))
    }
  }

  return user
}

export const userReducer: Reducer<User> = handleActions(
  {
    [updateMatchPromoAction]: (state, { payload }) => {
      return produce(state, draft => {
        if (!draft) {
          return draft
        } else if (!draft.matchPromo || !payload) {
          draft.matchPromo = payload
        } else {
          Object.assign(draft.matchPromo, payload)
        }
      })
    },

    [setUserAction]: (state, { payload }) =>
      produce(state, draft => {
        const newUser = {
          ...draft,
          ...payload,
        }

        if (!newUser.id) {
          return state
        }

        return normalizeUser(newUser)
      }),

    [logoutAction]: (state, { payload }) =>
      produce(state, draft => {
        endSession()
        return null
      }),

    [changeUserSettingAction]: (state, { payload }) =>
      produce(state, draft => {
        draft.systemSettings[payload.systemName][payload.settingName] =
          payload.value
      }),
  },
  initialState,
)
