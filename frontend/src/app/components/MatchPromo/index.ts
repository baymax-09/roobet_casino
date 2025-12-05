import React from 'react'

export const MatchPromo = React.lazy(() =>
  import('./MatchPromo').then(({ MatchPromo }) => ({ default: MatchPromo })),
)
