import React from 'react'

import { asLazyRoute } from 'app/util'

export const VIPRoute = React.lazy(() => {
  return asLazyRoute(import('./VIPRoute'))
})
