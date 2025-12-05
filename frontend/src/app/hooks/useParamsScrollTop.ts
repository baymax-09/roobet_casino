import React from 'react'
import { useLocation } from 'react-router'

import { useApp } from 'app/context'

/**
 * Scroll to top on param change within the component.
 */
export const useParamsScrollTop = () => {
  const { pathname, search } = useLocation()
  const { appContainer } = useApp()

  React.useEffect(() => {
    /**
     * It appears that in Safari, the completion of the scrolling
     * process is interrupted likely due to content jumps interrupting
     * the scroll. Placing the scroll in a different context seems
     * to alleviate the problem.
     */
    queueMicrotask(() => {
      appContainer?.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      })
    })
  }, [pathname, search])
}
