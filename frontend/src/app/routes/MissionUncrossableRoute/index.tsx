import React from 'react'

export const MissionUncrossableRoute = React.lazy(() =>
  import('./MissionUncrossableRoute').then(({ MissionUncrossableRoute }) => ({
    default: MissionUncrossableRoute,
  })),
)
