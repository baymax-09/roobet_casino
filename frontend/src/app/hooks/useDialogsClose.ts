import React from 'react'

import {
  DialogsDispatchContext,
  DialogContextActions,
} from 'app/context/dialogs.context'

export function useDialogsClose() {
  const dispatch = React.useContext(DialogsDispatchContext)

  if (dispatch === undefined) {
    throw new Error('useDialogOpener must be used within a DialogsProvider')
  }

  return (id: string | null = null) => {
    dispatch({
      type: DialogContextActions.Close,
      payload: id,
    })
  }
}
