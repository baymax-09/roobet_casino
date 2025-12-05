import React from 'react'

import { DialogLoader } from '../DialogLoader'

const LazyKOTHDialog = React.lazy(() =>
  import('./KOTHDialog').then(({ KOTHDialog }) => ({
    default: KOTHDialog,
  })),
)

export const KOTHDialog = props => (
  <DialogLoader>
    <LazyKOTHDialog {...props} />
  </DialogLoader>
)
