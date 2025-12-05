import React from 'react'

import {
  DialogsDispatchContext,
  DialogContextActions,
} from 'app/context/dialogs.context'
import { store } from 'app/util/store'
import { getDialog, type DialogKey } from 'app/dialogs/util'

type DialogsOpenerOptions = Partial<{
  data: unknown
  params: unknown
}>

export function useDialogsOpener() {
  const dispatch = React.useContext(DialogsDispatchContext)

  if (dispatch === undefined) {
    throw new Error('useDialogsOpener must be used within a DialogsProvider')
  }

  return React.useCallback(
    (key: DialogKey, options: DialogsOpenerOptions = {}) => {
      const dialog = getDialog(key)
      const isLoggedIn = !!store.getState().user

      if (!dialog) {
        return
      }

      if (dialog.options.requiresAuth && !isLoggedIn) {
        dispatch({
          type: DialogContextActions.Open,
          payload: {
            key: 'auth',
            options: {},
            props: {},
            data: {
              continue: {
                options,
                dialog: key,
              },
            },
          },
        })
        return
      }

      dispatch({
        type: DialogContextActions.Open,
        payload: {
          key,
          options,
          data: options.data || {},
          props: options.params || {},
        },
      })
    },
    [dispatch],
  )
}

export function withDialogsOpener(Component) {
  return React.memo(props => {
    const openDialog = useDialogsOpener()
    return <Component openDialog={openDialog} {...props} />
  })
}
