import React from 'react'
import {
  Dialog as MuiDialog,
  useMediaQuery,
  type DialogProps as MuiDialogProps,
} from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'

type DialogProps = React.PropsWithChildren<Partial<MuiDialogProps>>

const Dialog: React.FC<DialogProps> = props => {
  const normalSize = useMediaQuery(uiTheme.breakpoints.up('md'))

  const { children, ...other } = props

  return (
    <MuiDialog fullScreen={!normalSize} open={false} {...other}>
      {children}
    </MuiDialog>
  )
}

export default React.memo(Dialog)
