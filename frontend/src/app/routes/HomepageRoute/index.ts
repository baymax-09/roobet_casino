import React from 'react'

import { asLazyRoute } from 'app/util'

export const HomepageRoute = React.lazy(() =>
  asLazyRoute(import('./HomepageRoute')),
)

export { default as GameCTA } from './GameCTA'
