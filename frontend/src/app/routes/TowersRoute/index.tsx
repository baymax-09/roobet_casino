import React from 'react'

export const TowersRoute = React.lazy(() =>
  import('./TowersRoute').then(({ TowersRoute }) => ({ default: TowersRoute })),
)
