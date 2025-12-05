import React from 'react'
import {
  __RouterContext as ReactRouterContext,
  type RouteComponentProps as ReactRouterRouteComponentProps,
} from 'react-router'
import { Fade } from '@mui/material'

import { GeneralLoadingContext, useApp } from 'app/context'

import {
  LazyRouteTimeoutError,
  type RouteChildren,
  findMatchingElement,
  isPathEqual,
  isSearchEqual,
} from './utils'

const FADE_TRANSITION_MS = 300

interface LazySwitcherProps {
  children: RouteChildren
  maxLoadingMs: number
}

const LazySwitcher: React.FC<LazySwitcherProps> = ({
  children,
  maxLoadingMs = 0,
}) => {
  const routerContext = React.useContext(ReactRouterContext)
  const lazyContext = React.useContext(GeneralLoadingContext)
  const { appContainer } = useApp()

  const isCurrentlyLoading = lazyContext.get('lazyRoute')

  const [current, setCurrent] = React.useState(routerContext)
  const [next, setNext] = React.useState(current)
  const [timedOut, setTimedOut] = React.useState(false)

  // This must be controlled by state, as ErrorBoundaries
  // do not catch errors thrown from setTimeout callbacks.
  // @see https://reactjs.org/docs/error-boundaries.html#introducing-error-boundaries
  React.useEffect(() => {
    if (timedOut) {
      // Bubble up to route loader error boundary.
      throw new LazyRouteTimeoutError()
    }
  }, [timedOut])

  // Scroll to top when loading has finished.
  React.useEffect(() => {
    if (!isCurrentlyLoading) {
      appContainer?.scrollTo({
        top: 0,
        behavior: 'instant',
      })
    }
  }, [isCurrentlyLoading, appContainer])

  // Called when location changed.
  React.useEffect(() => {
    // If not the same route mount it to start loading.
    if (!isPathEqual(routerContext, next)) {
      lazyContext.start('lazyRoute')

      // This must occur one tick later, or React
      // ignores the state update.
      setTimeout(() => {
        setNext({ ...routerContext })
      })
    }

    if (isPathEqual(routerContext, current)) {
      if (!isSearchEqual(routerContext, current)) {
        setCurrent({ ...routerContext })
      }
    }
  }, [routerContext, children, current, isCurrentlyLoading, lazyContext, next])

  // Called when loading ends.
  React.useEffect(() => {
    if (!isCurrentlyLoading && !isPathEqual(current, next)) {
      setCurrent(next)
    }
  }, [isCurrentlyLoading, current, next])

  // setTimeout if maxLoadingTime is provided.
  React.useEffect(() => {
    if (maxLoadingMs > 0 && !isPathEqual(current, next)) {
      const timeout = setTimeout(() => {
        lazyContext.done('lazyRoute')
        setTimedOut(true)
      }, maxLoadingMs)

      return () => clearTimeout(timeout)
    }
  }, [current, next, lazyContext, maxLoadingMs])

  // Memoize current and next components.
  return React.useMemo(
    () => (
      <>
        {/* current */}
        <RouteComponent
          key={current.location.pathname}
          context={current}
          allRoutes={children}
        />

        {/* hidden next */}
        {!isPathEqual(current, next) && (
          <RouteComponent
            key={next.location.pathname}
            context={next}
            allRoutes={children}
            hidden
          />
        )}
      </>
    ),
    [current, next, children],
  )
}

interface RouteComponentProps {
  context: ReactRouterRouteComponentProps
  allRoutes: RouteChildren
  hidden?: boolean
}

const RouteComponent: React.FC<RouteComponentProps> = ({
  context,
  allRoutes,
  hidden = false,
}) => (
  <React.Suspense fallback={null}>
    <Fade in={!hidden} timeout={FADE_TRANSITION_MS}>
      <div style={hidden ? { display: 'none' } : undefined}>
        {React.useMemo(
          () => findMatchingElement(context, allRoutes),
          [context, allRoutes],
        )}
      </div>
    </Fade>
  </React.Suspense>
)

interface LazySwitchProps {
  children: RouteChildren
  maxLoadingMs: number
  errorBoundary: any
}

export const LazySwitch: React.FC<LazySwitchProps> = ({
  children,
  errorBoundary: ErrorBoundary,
  maxLoadingMs,
}) => (
  <ErrorBoundary>
    <LazySwitcher maxLoadingMs={maxLoadingMs}>{children}</LazySwitcher>
  </ErrorBoundary>
)
