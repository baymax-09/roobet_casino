import React from 'react'

import { GameRoute } from '../GameRoute'

export const DiceRoute = () => {
  return <GameRoute identifier="housegames:dice" canFavorite isHouseGame />
}
