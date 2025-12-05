import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyProfileDialog = React.lazy(() =>
  import('./ProfileDialog').then(({ ProfileDialog }) => ({
    default: ProfileDialog,
  })),
)

export const ProfileDialog = props => (
  <DialogLoader>
    <LazyProfileDialog {...props} />
  </DialogLoader>
)
