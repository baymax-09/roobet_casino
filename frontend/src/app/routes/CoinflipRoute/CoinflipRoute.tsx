import React from 'react'

import { GameRoute } from '../GameRoute'

export const CoinflipRoute: React.FC = () => {
  return <GameRoute identifier="housegames:coinflip" canFavorite isHouseGame />
}
