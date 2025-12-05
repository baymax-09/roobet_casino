import React from 'react'

export const JungleMinesRoute = React.lazy(() =>
  import('./JungleMinesRoute').then(({ JungleMinesRoute }) => ({
    default: JungleMinesRoute,
  })),
)
