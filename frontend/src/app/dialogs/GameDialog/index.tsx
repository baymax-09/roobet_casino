import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyGameDialog = React.lazy(() =>
  import('./GameDialog').then(({ GameDialog }) => ({
    default: GameDialog,
  })),
)

export const GameDialog = props => (
  <DialogLoader>
    <LazyGameDialog {...props} />
  </DialogLoader>
)
