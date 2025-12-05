import React from 'react'

import { asLazyRoute } from 'app/util'

export const GameTagRoute = React.lazy(() => {
  return asLazyRoute(
    import(/* webpackPrefetch: true */ './GameTagRoute').then(
      ({ GameTagRoute }) => ({
        default: GameTagRoute,
      }),
    ),
  )
})

export const GameProviderRoute = React.lazy(() => {
  return asLazyRoute(
    import(/* webpackPrefetch: true */ './GameProviderRoute').then(
      ({ GameProviderRoute }) => ({
        default: GameProviderRoute,
      }),
    ),
  )
})

export const GameFavoritesRoute = React.lazy(() => {
  return asLazyRoute(
    import(/* webpackPrefetch: true */ './GameFavoritesRoute').then(
      ({ GameFavoritesRoute }) => ({
        default: GameFavoritesRoute,
      }),
    ),
  )
})
