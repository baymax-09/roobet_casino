import React from 'react'

export const GameRoute = React.lazy(() => {
  return import(/* webpackPrefetch: true */ './GameRoute')
})
