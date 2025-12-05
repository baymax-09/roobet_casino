import React from 'react'

export const MinesRoute = React.lazy(() =>
  import('./MinesRoute').then(({ MinesRoute }) => ({ default: MinesRoute })),
)
