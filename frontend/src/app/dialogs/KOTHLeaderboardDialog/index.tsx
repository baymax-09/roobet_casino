import React from 'react'

import { DialogLoader } from '../DialogLoader'

const LazyKOTHLeaderboardDialog = React.lazy(() =>
  import('./KOTHLeaderboardDialog').then(({ KOTHLeaderboardDialog }) => ({
    default: KOTHLeaderboardDialog,
  })),
)

export const KOTHLeaderboardDialog = props => (
  <DialogLoader>
    <LazyKOTHLeaderboardDialog {...props} />
  </DialogLoader>
)
