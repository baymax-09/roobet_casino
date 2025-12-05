import React from 'react'

import { asLazyRoute } from 'app/util'

export const ColorsRoute = React.lazy(() =>
  asLazyRoute(
    import('./ColorsRoute').then(({ ColorsRoute }) => ({
      default: ColorsRoute,
    })),
  ),
)
