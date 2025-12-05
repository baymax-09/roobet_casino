import React from 'react'

import { GameRoute } from '../GameRoute'

export const TowersRoute: React.FC = () => {
  return <GameRoute identifier="housegames:towers" canFavorite isHouseGame />
}
