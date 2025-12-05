import React from 'react'

export const RaffleRoute = React.lazy(() => {
  return import('./RaffleRoute').then(({ RaffleRoute }) => ({
    default: RaffleRoute,
  }))
})
