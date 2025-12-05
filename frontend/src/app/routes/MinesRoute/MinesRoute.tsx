import React from 'react'

import { GameRoute } from '../GameRoute'

export const MinesRoute: React.FC = () => {
  return <GameRoute identifier="housegames:mines" canFavorite isHouseGame />
}
