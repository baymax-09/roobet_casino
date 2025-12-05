import React from 'react'

import { asLazyRoute } from 'app/util'

export const CasinoPageRoute = React.lazy(() =>
  asLazyRoute(import(/* webpackPrefetch: true */ './CasinoPageRoute')),
)

export * from './casinoLinks'
