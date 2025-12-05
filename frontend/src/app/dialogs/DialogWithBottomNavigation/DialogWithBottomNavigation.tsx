import React from 'react'
import { Dialog, theme as uiTheme } from '@project-atl/ui'
import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import clsx from 'clsx'

export const useDialogWithBottomNavigationStyles = makeStyles(() =>
  createStyles({
    DialogWithBottomNavigation: {
      bottom: `${uiTheme.shape.bottomNavigationHeight}px !important`,
      zIndex: '1 !important',
    },
  }),
)

export const DialogWithBottomNavigation = props => {
  const { children, ...otherProps } = props
  const classes = useDialogWithBottomNavigationStyles()
  return (
    <Dialog
      {...otherProps}
      className={clsx(
        classes.DialogWithBottomNavigation,
        otherProps?.className,
      )}
    >
      {children}
    </Dialog>
  )
}
