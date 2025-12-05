import React from 'react'

export const DiceRoute = React.lazy(() =>
  import('./DiceRoute').then(({ DiceRoute }) => ({ default: DiceRoute })),
)
