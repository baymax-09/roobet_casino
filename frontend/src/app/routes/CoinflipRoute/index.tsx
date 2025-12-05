import React from 'react'

export const CoinflipRoute = React.lazy(() =>
  import('./CoinflipRoute').then(({ CoinflipRoute }) => ({
    default: CoinflipRoute,
  })),
)
