import React from 'react'

import { type TPGameEssential } from 'common/types'
import { useAxiosGet } from 'common/hooks'

interface GamesContextState {
  games: TPGameEssential[]
  loading: boolean
}

const defaultState: GamesContextState = {
  games: [],
  loading: true,
}

export const GamesStateContext =
  React.createContext<GamesContextState>(defaultState)

const GamesProvider = props => {
  const [state, setState] = React.useState(defaultState)

  useAxiosGet<TPGameEssential[]>('/tp-games/essentials', {
    onCompleted: data => {
      setState({
        games: data,
        loading: false,
      })
    },
  })

  return (
    <GamesStateContext.Provider value={state}>
      {props.children}
    </GamesStateContext.Provider>
  )
}

export function useGames() {
  const ctx = React.useContext(GamesStateContext)

  if (!ctx) {
    throw new Error('useGames() must be used inside GamesProvider')
  }

  return ctx
}

export default GamesProvider
