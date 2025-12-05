import React from 'react'

import { DialogsDispatchContext, DialogContextActions } from 'app/context'

export function useDialogsUpdate() {
  const dispatch = React.useContext(DialogsDispatchContext)

  if (dispatch === undefined) {
    throw new Error('useDialogsUpdate must be used within a DialogsProvider')
  }

  return (id, update) => {
    dispatch({
      type: DialogContextActions.Update,
      payload: {
        id,
        update,
      },
    })
  }
}
