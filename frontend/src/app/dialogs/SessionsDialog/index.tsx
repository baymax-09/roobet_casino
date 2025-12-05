import React from 'react'

import { DialogLoader } from '../DialogLoader'

const LazySessionsDialog = React.lazy(() =>
  import('./SessionsDialog').then(({ SessionsDialog }) => ({
    default: SessionsDialog,
  })),
)

export const SessionsDialog = props => (
  <DialogLoader>
    <LazySessionsDialog {...props} />
  </DialogLoader>
)
