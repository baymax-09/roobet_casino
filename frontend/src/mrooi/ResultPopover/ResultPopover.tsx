import React from 'react'
import { Typography, Popover } from '@mui/material'
import { bindPopover, type PopupState } from 'material-ui-popup-state/hooks'

import { styles, useResultPopoverStyles } from './ResultPopover.styles'

interface ResultPopoverProps {
  error?: boolean
  message?: string | null
  popupState: PopupState
  onExited?: (node: HTMLElement) => void
}

export const ResultPopoverView: React.FC<ResultPopoverProps> = ({
  error,
  message,
  popupState,
  onExited,
}) => {
  const classes = useResultPopoverStyles()

  return (
    <Popover
      {...bindPopover(popupState)}
      TransitionProps={{
        onExited,
      }}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      slotProps={{
        paper: {
          sx: [
            styles.resultPaper,
            error ? styles.errorResult : styles.successResult,
          ],
        },
      }}
    >
      <Typography className={classes.result}>{message}</Typography>
    </Popover>
  )
}

export const ResultPopover = React.memo(ResultPopoverView)
