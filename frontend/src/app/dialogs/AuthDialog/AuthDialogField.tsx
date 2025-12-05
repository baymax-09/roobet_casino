import React from 'react'
import { InputField, type InputFieldProps } from '@project-atl/ui'
import { type FieldError } from 'react-hook-form'

interface AuthDialogFieldProps extends Omit<InputFieldProps, 'error'> {
  className?: string
  error: FieldError | undefined
  handleSubmit?: () => void
}

export const AuthDialogField = React.memo(
  React.forwardRef<HTMLInputElement, AuthDialogFieldProps>(
    (
      { className, error = null, inputProps = {}, handleSubmit, ...props },
      ref,
    ) => {
      return (
        <InputField
          required
          fullWidth
          color="secondary"
          error={!!error}
          bottomMessage={!!error && error.message}
          inputRef={ref}
          inputProps={{
            // One of the 3 form-related packages we are using is disabling the native
            // functionality of pressing enter on a input field- this restores that.
            onKeyDown: event => {
              if (event.code === 'Enter') {
                if (handleSubmit) {
                  handleSubmit()
                }
              }
            },
            ...inputProps,
          }}
          {...props}
        />
      )
    },
  ),
)
