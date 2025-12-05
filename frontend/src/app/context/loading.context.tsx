import React from 'react'

type LoadingState = keyof typeof LoadingStatesDefault

interface GeneralLoadingContextShape {
  get: (loadingState: LoadingState) => boolean
  start: (loadingState: LoadingState) => void
  done: (loadingState: LoadingState) => void
  isLoading: boolean
}

const LoadingStatesDefault = {
  lazyRoute: false,
  route: false,
  translations: false,
}

export const GeneralLoadingContext =
  React.createContext<GeneralLoadingContextShape>({
    get: () => false,
    start: () => {
      // do nothing
    },
    done: () => {
      // do nothing
    },
    isLoading: false,
  })

// Debug name.
GeneralLoadingContext.displayName = 'GeneralLoadingContext'

type LoadingContextProviderProps = React.PropsWithChildren<Record<never, never>>

export const LoadingContextProvider: React.FC<LoadingContextProviderProps> = ({
  children,
}) => {
  const [loadingStates, setLoadingStates] = React.useState(LoadingStatesDefault)

  const start = React.useCallback((state: LoadingState) => {
    setLoadingStates(prev => {
      if (prev[state]) {
        return prev
      }

      return {
        ...prev,
        [state]: true,
      }
    })
  }, [])

  const done = React.useCallback((state: LoadingState) => {
    setLoadingStates(prev => {
      if (!prev[state]) {
        return prev
      }

      return {
        ...prev,
        [state]: false,
      }
    })
  }, [])

  const get = React.useCallback(
    (loadingState: LoadingState) => {
      return loadingStates[loadingState]
    },
    [loadingStates],
  )

  const isLoading: boolean = React.useMemo(() => {
    return Object.values(loadingStates).some(Boolean)
  }, [loadingStates])

  return (
    <GeneralLoadingContext.Provider value={{ isLoading, start, done, get }}>
      {children}
    </GeneralLoadingContext.Provider>
  )
}
