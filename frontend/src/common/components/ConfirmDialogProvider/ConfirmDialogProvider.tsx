import React from 'react'
import { ThemeProvider, StyledEngineProvider } from '@mui/material'

import { ConfirmDialog } from './ConfirmDialog'
import { ConfirmDialogContext } from './ConfirmDialogContext'

interface PromiseState {
  resolve: (value: unknown) => void
  reject: (reason?: any) => void
}

export function ConfirmDialogProvider(props) {
  const [resolveReject, setResolveReject] = React.useState<PromiseState | null>(
    null,
  )
  const [confirmDialogProps, setConfirmDialogProps] = React.useState({})

  const showConfirm = React.useCallback(confirmProps => {
    setConfirmDialogProps(confirmProps)

    return new Promise((resolve, reject) => {
      setResolveReject({ resolve, reject })
    })
  }, [])

  const onCancel = React.useCallback(() => {
    if (!resolveReject) {
      return
    }

    resolveReject.reject()
    setResolveReject(null)
  }, [resolveReject])

  const onConfirm = React.useCallback(
    form => {
      if (!resolveReject) {
        return
      }

      resolveReject.resolve(form)
      setResolveReject(null)
    },
    [resolveReject],
  )

  const closeMe = React.useCallback(() => setResolveReject(null), [])

  const mounted = resolveReject !== null

  return (
    <>
      <ConfirmDialogContext.Provider value={showConfirm}>
        {props.children}
      </ConfirmDialogContext.Provider>

      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={props.theme}>
          {mounted && (
            <ConfirmDialog
              {...confirmDialogProps}
              onCancel={onCancel}
              onConfirm={onConfirm}
              closeMe={closeMe}
            />
          )}
        </ThemeProvider>
      </StyledEngineProvider>
    </>
  )
}
