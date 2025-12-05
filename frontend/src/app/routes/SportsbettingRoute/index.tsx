import React from 'react'

export const SportsbettingRoute = React.lazy(() =>
  import('./SportsbettingRoute').then(({ SportsbettingRoute }) => ({
    default: SportsbettingRoute,
  })),
)
