import React from 'react'

import { GameRoute } from '../GameRoute'

export const MissionUncrossableRoute: React.FC = () => {
  return (
    <GameRoute identifier="housegames:linearmines" canFavorite isHouseGame />
  )
}
