import React from 'react'

import { AppStateContext } from 'app/context'

export function useChatHidden() {
  const ctx = React.useContext(AppStateContext)

  if (ctx === undefined) {
    throw new Error('useChatHidden must be used within a AppProvider')
  }

  return ctx.chatHidden
}
