import React from 'react'
import { Button, LinearProgress, Modal, Typography } from '@mui/material'
import { SnackbarContent, type VariantOverrides, useSnackbar } from 'notistack'

import { ErrorBoundary } from 'app/components'
import { useTranslate } from 'app/hooks'

import { useDialogLoaderStyles } from './DialogLoader.styles'

const LOADING_DELAY_MS = 200

type DialogLoaderProps = VariantOverrides['dialogToastError']

export const ErrorToast = () => {
  const classes = useDialogLoaderStyles()
  const translate = useTranslate()

  return (
    <div className={classes.ErrorDialog}>
      <div className={classes.ErrorDialog__dialog}>
        <Typography variant="h6" color="deprecated.textPrimary">
          {translate('dialogLoader.newUpdate')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {translate('dialogLoader.outdated')}
        </Typography>
      </div>
      <div>
        <Button
          size="small"
          color="secondary"
          variant="contained"
          onClick={() => window.location.reload()}
        >
          {translate('dialogLoader.refreshBrowser')}
        </Button>
      </div>
    </div>
  )
}

export const FullPageLoading = ({ error = false }) => {
  const classes = useDialogLoaderStyles()
  const [pastDelay, setPastDelay] = React.useState(error)
  const { enqueueSnackbar } = useSnackbar()

  // If an error occurs loading the modal chunk, lets assume
  // that chunk is no longer available due to a new release.
  const openErrorToast = React.useCallback(
    () =>
      enqueueSnackbar('', {
        variant: 'dialogToastError',
      }),
    [enqueueSnackbar],
  )

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setPastDelay(true)
    }, LOADING_DELAY_MS)

    return () => clearTimeout(timeout)
  }, [])

  // Open error toast if the fallback is from the error boundary.
  React.useEffect(() => {
    error && openErrorToast()
  }, [error])

  // React.useEffect(() => error && openErrorToast(), [error])

  // Prevent content flashing.
  if (!pastDelay) {
    return null
  }

  return (
    <Modal
      BackdropProps={{ className: classes.DialogLoader_backgroundColor }}
      open
    >
      <div className={classes.DialogLoader}>
        {!error && (
          <LinearProgress className={classes.DialogLoader__progress} />
        )}
      </div>
    </Modal>
  )
}

export const DialogLoader = React.forwardRef<HTMLDivElement, DialogLoaderProps>(
  ({ children }, ref) => {
    return (
      <SnackbarContent ref={ref}>
        <ErrorBoundary fallback={FullPageLoading}>
          <React.Suspense fallback={<FullPageLoading />}>
            {children}
          </React.Suspense>
        </ErrorBoundary>
      </SnackbarContent>
    )
  },
)
