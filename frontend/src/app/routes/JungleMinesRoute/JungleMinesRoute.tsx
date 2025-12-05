import React from 'react'

import { GameRoute } from '../GameRoute'

export const JungleMinesRoute: React.FC = () => {
  return (
    <GameRoute identifier="housegames:junglemines" canFavorite isHouseGame />
  )
}
