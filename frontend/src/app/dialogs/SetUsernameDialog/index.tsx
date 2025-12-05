import React from 'react'

import { DialogLoader } from '../DialogLoader'

const LazySetUsernameDialog = React.lazy(() =>
  import('./SetUsernameDialog').then(({ SetUsernameDialog }) => ({
    default: SetUsernameDialog,
  })),
)

export const SetUsernameDialog = props => (
  <DialogLoader>
    <LazySetUsernameDialog {...props} />
  </DialogLoader>
)
