import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { ErrorBoundary, type ErrorBoundaryFallback } from 'app/components'

const RouteError: ErrorBoundaryFallback = ({ prevLocation, recover }) => {
  const history = useHistory()

  const undoHistoryChange = React.useCallback(() => {
    const path = history.createHref(prevLocation)

    history.replace(path)
  }, [prevLocation, history])

  React.useEffect(() => {
    recover()
    undoHistoryChange()
  }, [recover, undoHistoryChange])

  return <></>
}

export const RouteErrorBoundary = ({ children }) => {
  const location = useLocation()

  const [state, setState] = React.useState({
    previous: location,
    current: location,
  })

  // Keep track of current and previous locations.
  React.useEffect(() => {
    if (location.key !== state.current.key) {
      setState(prev => ({
        ...prev,
        previous: prev.current,
        current: location,
      }))
    }
  }, [location, state])

  return (
    <ErrorBoundary
      fallback={RouteError}
      params={{ prevLocation: state.previous }}
    >
      {children}
    </ErrorBoundary>
  )
}
