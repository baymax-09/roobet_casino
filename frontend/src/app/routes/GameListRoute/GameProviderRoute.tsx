import React from 'react'
import { useHistory } from 'react-router-dom'

import { GAME_PROVIDERS } from 'app/constants'
import { GameProviderPage } from 'app/components/GameList'

/**
 * Preset list of providers to display on homepage, and options to render full page list.
 */
export const GameProviderRoute = props => {
  const { path } = props.match.params
  const history = useHistory()

  const providerConfig = Object.values(GAME_PROVIDERS).find(
    config => config.path === path,
  )

  if (!providerConfig) {
    // Redirect home.
    history.replace('/')
    return undefined
  }

  return <GameProviderPage config={providerConfig} />
}
