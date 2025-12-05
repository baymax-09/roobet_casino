import React from 'react'

import { GameRoute } from '../GameRoute'

export const HotBoxRoute: React.FC = () => {
  return <GameRoute identifier="housegames:hotbox" canFavorite isHouseGame />
}
