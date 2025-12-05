import { handleActions, createAction } from 'redux-actions'
import produce from 'immer'
import { type Reducer } from 'redux'

import { defaultSocket } from 'app/lib/sockets'

export const setSocketUserAction = 'sockets/set'
export const setSocketUser = createAction(setSocketUserAction)

const initialState = {}

export const socketsReducer: Reducer<unknown> = handleActions(
  {
    [setSocketUserAction]: (state, { payload }) =>
      produce(state, draft => {
        // Websocket connections can occur before the user is authenticated,
        // so we need to disconnect before reconnecting, which prompts
        // the server to join the user to the correct room.
        if (defaultSocket._socket && defaultSocket._socket.connected) {
          defaultSocket._socket.disconnect()
        }
        defaultSocket._socket.connect()
      }),
  },
  initialState,
)
