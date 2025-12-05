import React from 'react'
import { StyledEngineProvider } from '@mui/material'

import { useLazyRoute } from 'app/hooks'

export const CrashRoute = React.lazy(() => {
  return import('./CrashRoute').then(({ CrashRoute }) => ({
    default: function LazyCrashRoute(props) {
      useLazyRoute(true)

      return (
        <StyledEngineProvider injectFirst>
          <CrashRoute {...props} />
        </StyledEngineProvider>
      )
    },
  }))
})
