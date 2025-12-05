import React from 'react'

import { GameRoute } from '../GameRoute'

export const PlinkoRoute: React.FC = () => {
  return <GameRoute identifier="housegames:Plinko" canFavorite isHouseGame />
}
