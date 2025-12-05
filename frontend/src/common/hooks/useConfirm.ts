import React from 'react'

import { ConfirmDialogContext } from '../components/ConfirmDialogProvider/ConfirmDialogContext'

export function useConfirm() {
  const context = React.useContext(ConfirmDialogContext)

  if (!context) {
    throw new Error(
      'ConfirmDialogContext must be below a ConfirmDialogProvider.',
    )
  }

  return context
}
