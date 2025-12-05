import React from 'react'
import clsx from 'clsx'
import {
  DialogTitle as MuiDialogTitle,
  type DialogTitleProps as MuiDialogTitleProps,
  IconButton,
  type DialogProps as MuiDialogProps,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import { useDialogTitleStyles } from './DialogTitle.styles'

type DialogTitleProps = MuiDialogTitleProps & {
  onClose?: MuiDialogProps['onClose']
  dark?: boolean
  light?: boolean
  compact?: boolean
}

const DialogTitle: React.FC<DialogTitleProps> = ({
  children,
  onClose,
  dark = false,
  light = false,
  compact = false,
  className,
  ...other
}) => {
  const classes = useDialogTitleStyles()

  const onDialogClose = React.useCallback(() => {
    if (onClose) {
      onClose({}, 'backdropClick')
    }
  }, [onClose])

  return (
    <MuiDialogTitle
      className={clsx(
        classes.root,
        {
          [classes.light]: light,
          [classes.dark]: dark,
          [classes.compact]: compact,
        },
        className,
      )}
      {...other}
    >
      <div className={classes.title}>{children}</div>

      {!!onClose && (
        <IconButton
          color="primary"
          onClick={onDialogClose}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      )}
    </MuiDialogTitle>
  )
}

export default React.memo(DialogTitle)
