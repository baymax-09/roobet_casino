import React from 'react'

import { useFeatureFlags } from 'app/hooks'

import { ColorsRoute } from '../ColorsRoute'
import { GameRoute } from '../GameRoute'

export const RouletteNewRoute: React.FC = () => {
  const { loading, allowed } = useFeatureFlags(['housegames:roulette'])
  if (loading) {
    return null
  }
  if (!allowed) {
    return <ColorsRoute />
  }
  return <GameRoute identifier="housegames:roulette" canFavorite isHouseGame />
}
