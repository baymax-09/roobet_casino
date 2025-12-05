import React from 'react'

export const PlinkoRoute = React.lazy(() =>
  import('./PlinkoRoute').then(({ PlinkoRoute }) => ({ default: PlinkoRoute })),
)
