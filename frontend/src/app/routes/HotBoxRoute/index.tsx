import React from 'react'

export const HotBoxRoute = React.lazy(() =>
  import('./HotBoxRoute').then(({ HotBoxRoute }) => ({ default: HotBoxRoute })),
)
