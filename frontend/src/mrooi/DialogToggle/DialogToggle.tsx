import React from 'react'
import {
  type ButtonProps,
  Button,
  IconButton,
  type IconButtonProps,
} from '@mui/material'

import { useDialogsClose } from 'app/hooks/useDialogsClose'
import { useDialogsOpener } from 'app/hooks/useDialogsOpener'
import { type DialogParams, type DialogKey } from 'app/dialogs/util'

type DialogToggleProps<K extends DialogKey> = React.PropsWithChildren<{
  /**
   * Technically you can pass more than just the accepted querystring params, but this is better than nothing for now
   */
  params?: { params: DialogParams<K> }
  dialog: K
  /** For backwards compatibility with modals */
  preventDialogClose?: boolean
  useIconButton?: boolean
}> &
  Partial<Omit<ButtonProps & IconButtonProps, 'onClick'>>

const DialogToggle = <K extends DialogKey>({
  children,
  params,
  dialog,
  preventDialogClose,
  useIconButton,
  ...buttonProps
}: DialogToggleProps<K>) => {
  const closeDialogs = useDialogsClose()
  const openDialog = useDialogsOpener()

  const _onClick = React.useCallback(
    evt => {
      if (evt) {
        evt.preventDefault()
      }
      if (!preventDialogClose) {
        closeDialogs()
      }
      openDialog(dialog, params)
    },
    [preventDialogClose, openDialog, dialog, params, closeDialogs],
  )

  if (useIconButton) {
    return (
      <IconButton {...buttonProps} onClick={_onClick} size="large">
        {children}
      </IconButton>
    )
  }
  return (
    <Button {...buttonProps} onClick={_onClick}>
      {children}
    </Button>
  )
}

export default DialogToggle
