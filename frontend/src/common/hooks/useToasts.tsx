import React from 'react'
import { type OptionsObject, useSnackbar } from 'notistack'

import { ToastCloseIcon } from 'common/components'

/** @todo this should support our custom variants and those should be switched to use this hook. */
export const useToasts = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  const toasts = React.useMemo(
    () => ({
      toast: {
        info: (message: string, options?: Omit<OptionsObject, 'variant'>) =>
          enqueueSnackbar(message, {
            ...options,
            variant: 'info',
            action: key => <ToastCloseIcon variant="info" snackbarKey={key} />,
          }),
        warn: (message: string, options?: Omit<OptionsObject, 'variant'>) =>
          enqueueSnackbar(message, {
            ...options,
            variant: 'warning',
            action: key => (
              <ToastCloseIcon variant="warning" snackbarKey={key} />
            ),
          }),
        error: (message: string, options?: Omit<OptionsObject, 'variant'>) =>
          enqueueSnackbar(message, {
            ...options,
            variant: 'error',
            action: key => <ToastCloseIcon variant="error" snackbarKey={key} />,
          }),
        success: (message: string, options?: Omit<OptionsObject, 'variant'>) =>
          enqueueSnackbar(message, {
            ...options,
            variant: 'success',
            action: key => (
              <ToastCloseIcon variant="success" snackbarKey={key} />
            ),
          }),
      },
      closeToast: closeSnackbar,
    }),
    [enqueueSnackbar, closeSnackbar],
  )

  return toasts
}
