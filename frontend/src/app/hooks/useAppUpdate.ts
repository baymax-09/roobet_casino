import React from 'react'

import { AppDispatchContext } from 'app/context'

export function useAppUpdate() {
  const dispatch = React.useContext(AppDispatchContext)

  if (dispatch === undefined) {
    throw new Error('useAppUpdate must be used within a AppProvider')
  }

  return dispatch
}
