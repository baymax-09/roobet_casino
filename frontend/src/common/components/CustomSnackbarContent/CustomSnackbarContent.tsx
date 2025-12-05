import React from 'react'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'
import { type CustomContentProps, MaterialDesignContent } from 'notistack'

const useCustomSnackbarContentStyles = makeStyles(() =>
  createStyles({
    Style: {
      padding: uiTheme.spacing(1),
      borderRadius: uiTheme.shape.borderRadius,
      fontWeight: uiTheme.typography.fontWeightMedium,
      fontSize: uiTheme.typography.body2.fontSize,
      lineHeight: uiTheme.typography.body2.lineHeight,

      '& #notistack-snackbar': {
        gap: uiTheme.spacing(0.5),
        padding: 0,
      },

      // Selecting the action container at the very right (the close icon) of the snackbar.
      '& div:nth-child(2)': {
        paddingLeft: 0,
      },

      '&.notistack-MuiContent-success': {
        backgroundColor: uiTheme.palette.success[700],
      },
      '&.notistack-MuiContent-error': {
        backgroundColor: uiTheme.palette.error[500],
      },
      '&.notistack-MuiContent-warning': {
        backgroundColor: uiTheme.palette.secondary[500],
        color: uiTheme.palette.neutral[900],
      },
      '&.notistack-MuiContent-info': {
        backgroundColor: uiTheme.palette.primary[500],
      },
      '&.notistack-MuiContent-default': {
        backgroundColor: uiTheme.palette.neutral[600],
      },
    },
  }),
)

export const CustomSnackbarContent = React.forwardRef<
  HTMLDivElement,
  CustomContentProps
>((otherProps, ref) => {
  const classes = useCustomSnackbarContentStyles()

  return (
    <MaterialDesignContent
      ref={ref}
      {...otherProps}
      className={classes.Style}
    />
  )
})
