import React from 'react'

import { asLazyRoute } from 'app/util'

export const FairRoute = React.lazy(() =>
  asLazyRoute(
    import('./FairRoute').then(({ FairRoute }) => ({ default: FairRoute })),
  ),
)
