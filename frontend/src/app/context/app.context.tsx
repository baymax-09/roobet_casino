import React from 'react'
import { useImmer, type Updater } from 'use-immer'

interface AppState {
  hasBanner: boolean
  hideBalance: boolean
  chatHidden: boolean
  fabHidden: boolean
  sideNavigationOpen: boolean
  appContainer: HTMLDivElement | null
}

export type UpdateDispatch = Updater<AppState>

const defaultState: AppState = {
  hasBanner: false,
  hideBalance: false,
  chatHidden: false,
  fabHidden: false,
  sideNavigationOpen: false,
  appContainer: null,
}

// TODO: There is no need for multiple contexts, the AppStateContext should provide
// both the current state and the dispatch function.
export const AppStateContext = React.createContext<AppState>(defaultState)
export const AppDispatchContext = React.createContext<
  UpdateDispatch | undefined
>(undefined)

const AppProvider = props => {
  const [state, updateState] = useImmer(defaultState)

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={updateState}>
        {props.children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  )
}

export function useApp() {
  const ctx = React.useContext(AppStateContext)

  if (!ctx) {
    throw new Error('useApp() must be used inside AppProvider')
  }

  return ctx
}

export default React.memo(AppProvider)
