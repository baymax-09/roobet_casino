import React from 'react'

import { GeneralLoadingContext } from 'app/context'
import { events } from 'common/core'

/**
 * @note This hook may only be used inside LazyRoutes.
 */
export const useLazyRoute = (routeHasLoaded?: boolean) => {
  const { done: doneLoading, get: getLoading } = React.useContext(
    GeneralLoadingContext,
  )
  const loading = getLoading('lazyRoute')

  const done = React.useCallback(() => {
    doneLoading('lazyRoute')
    events.emit('loaderpreconditions', ['route'])
  }, [doneLoading])

  React.useEffect(() => {
    if (routeHasLoaded === true) {
      done()
    }
  }, [done, routeHasLoaded])

  return { done, loading }
}
