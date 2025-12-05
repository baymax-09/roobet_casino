import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyFreePlayDialog = React.lazy(() =>
  import('./FreePlayDialog').then(({ FreePlayDialog }) => ({
    default: FreePlayDialog,
  })),
)

export const FreePlayDialog = props => (
  <DialogLoader>
    <LazyFreePlayDialog {...props} />
  </DialogLoader>
)
