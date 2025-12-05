import React from 'react'
import { Button, CircularProgress, type ButtonProps } from '@mui/material'

interface LoadingButtonProps extends ButtonProps {
  /** The text that the `LoadingButton` displays. */
  label: string
  /** Determines whether or not to render the loading progress spinner. */
  loading: boolean
  spinnerColor?: 'primary' | 'secondary'
}

export const LoadingButton: React.FC<
  React.PropsWithChildren<LoadingButtonProps>
> = React.memo(
  React.forwardRef(
    ({ label, loading, spinnerColor = 'secondary', ...buttonProps }, ref) => {
      return (
        <Button disabled={loading} ref={ref} {...buttonProps}>
          {loading ? (
            <CircularProgress color={spinnerColor} size={24} />
          ) : (
            label
          )}
        </Button>
      )
    },
  ),
)

LoadingButton.displayName = 'LoadingButton'
