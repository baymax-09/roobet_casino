import React from 'react'
import { ActionIcon, theme as uiTheme } from '@project-atl/ui'
import { Close } from '@project-atl/ui/assets'
import { type CSSProperties } from 'react'
import { type OptionsObject, type SnackbarKey, useSnackbar } from 'notistack'

const HOVER_BACKGROUND_COLOR: Record<
  Exclude<OptionsObject['variant'], undefined>,
  CSSProperties['backgroundColor']
> = {
  success: uiTheme.palette.success[800],
  error: uiTheme.palette.error[700],
  warning: uiTheme.palette.secondary[700],
  info: uiTheme.palette.primary[700],
  default: uiTheme.palette.neutral[700],
  dialogToastError: uiTheme.palette.error[700],
  roowardsToast: uiTheme.palette.neutral[700],
}

interface CloseIconProps {
  variant: OptionsObject['variant']
  snackbarKey: SnackbarKey
}

export const ToastCloseIcon: React.FC<CloseIconProps> = ({
  variant,
  snackbarKey,
}) => {
  const { closeSnackbar } = useSnackbar()
  const hoverBackgroundColor = HOVER_BACKGROUND_COLOR[variant ?? 'default']

  const handleClose = React.useCallback(() => {
    closeSnackbar(snackbarKey)
  }, [closeSnackbar, snackbarKey])

  return (
    <ActionIcon
      sx={{ borderRadius: 1, marginLeft: 0.5, marginRight: 1 }}
      hoverBackgroundColor={hoverBackgroundColor}
      onClick={handleClose}
    >
      <Close
        iconFill={
          variant === 'warning'
            ? uiTheme.palette.neutral[900]
            : uiTheme.palette.common.white
        }
      />
    </ActionIcon>
  )
}
