import React from 'react'

export const RouletteNewRoute = React.lazy(() =>
  import('./RouletteNewRoute').then(({ RouletteNewRoute }) => ({
    default: RouletteNewRoute,
  })),
)
